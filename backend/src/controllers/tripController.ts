import { Request, Response } from "express";
import Trip from "../models/Trip.js";
import Message from "../models/Message.js";

interface FilterQuery {
  $or?: object[];
  destination?: object;
  pickupLocation?: object;
  budget?: object;
  date?: object;
}

export const getTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      destination,
      pickupLocation,
      budget,
      month,
      year,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as Record<string, string>;

    const query: FilterQuery = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    if (pickupLocation) {
      query.pickupLocation = { $regex: pickupLocation, $options: "i" };
    }

    if (budget) {
      const budgetValue = Number(budget);
      if (budgetValue === 100001) {
        query.budget = { $gt: 100000 };
      } else {
        query.budget = { $lte: budgetValue };
      }
    }

    if (month && year) {
      query.date = { $regex: `.*${month}.*${year}.*`, $options: "i" };
    } else if (month) {
      const monthNames = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december",
      ];
      const monthIndex = monthNames.findIndex((m) =>
        m.startsWith(month.toLowerCase())
      );
      if (monthIndex !== -1) {
        query.date = { $regex: `.*${monthNames[monthIndex]}.*`, $options: "i" };
      }
    } else if (year) {
      query.date = { $regex: `.*${year}.*`, $options: "i" };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const trips = await Trip.find(query)
      .populate("members", "name email")
      .populate("createdBy", "name email")
      .sort(sortOptions);

    res.status(200).json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: "Error fetching trips", error: (error as Error).message });
  }
};

export const createTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { title, description, destination, pickupLocation, budget, date } =
      req.body as {
        title: string;
        description?: string;
        destination: string;
        pickupLocation: string;
        budget?: string | number;
        date?: string;
      };

    if (!title || !destination || !pickupLocation) {
      res.status(400).json({ message: "Title, destination, and pickup location are required" });
      return;
    }

    if (budget && (isNaN(Number(budget)) || Number(budget) < 0)) {
      res.status(400).json({ message: "Budget must be a positive number" });
      return;
    }

    if (date && !isValidDate(date)) {
      res.status(400).json({ message: "Date should be in Month-Year format (e.g., December-2024)" });
      return;
    }

    const trip = await Trip.create({
      title,
      description,
      destination,
      pickupLocation,
      budget: budget ? Number(budget) : undefined,
      date: date || undefined,
      members: [req.user._id],
      createdBy: req.user._id,
    });

    await trip.populate("members", "name email");
    await trip.populate("createdBy", "name email");

    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(400).json({ message: "Error creating trip", error: (error as Error).message });
  }
};

export const getTripById = async (req: Request, res: Response): Promise<void> => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("members", "name email")
      .populate("createdBy", "name email");

    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    res.status(200).json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).json({ message: "Error fetching trip", error: (error as Error).message });
  }
};

export const joinTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    if (!trip.members.includes(req.user._id)) {
      trip.members.push(req.user._id);
      await trip.save();
    }

    await trip.populate("members", "name email");
    await trip.populate("createdBy", "name email");

    res.status(200).json(trip);
  } catch (error) {
    console.error("Error joining trip:", error);
    res.status(400).json({ message: "Error joining trip", error: (error as Error).message });
  }
};

export const getFilterOptions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const destinations = await Trip.distinct("destination");
    const pickupLocations = await Trip.distinct("pickupLocation");
    const dates = await Trip.distinct("date");
    const budgets = await Trip.distinct("budget");

    res.status(200).json({
      destinations: (destinations as string[]).filter(Boolean).sort(),
      pickupLocations: (pickupLocations as string[]).filter(Boolean).sort(),
      dates: (dates as string[]).filter(Boolean).sort(),
      budgets: (budgets as number[]).filter(Boolean).sort((a, b) => a - b),
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ message: "Error fetching filter options", error: (error as Error).message });
  }
};

export const getTripMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const isMember =
      trip.members.includes(req.user._id) ||
      trip.createdBy.equals(req.user._id);

    if (!isMember) {
      res.status(403).json({ message: "You must be a member of this trip to view messages" });
      return;
    }

    const messages = await Message.find({ trip: id })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages", error: (error as Error).message });
  }
};

export const sendTripMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body as { text: string };

    if (!text || !text.trim()) {
      res.status(400).json({ message: "Message text is required" });
      return;
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const isMember =
      trip.members.includes(req.user._id) ||
      trip.createdBy.equals(req.user._id);

    if (!isMember) {
      res.status(403).json({ message: "You must be a member of this trip to send messages" });
      return;
    }

    const message = await Message.create({
      trip: id,
      sender: req.user._id,
      text: text.trim(),
    });

    await message.populate("sender", "name email");

    const io = req.app.get("io");
    if (io) {
      console.log(`\ud83d\udce4 Emitting message to trip room: ${id}`, message);
      io.to(id).emit("new_message", message);
    } else {
      console.error("\u274c Socket.io not available for message emission");
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message", error: (error as Error).message });
  }
};

export const updateTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, destination, pickupLocation, budget, date } =
      req.body as {
        title: string;
        description?: string;
        destination: string;
        pickupLocation: string;
        budget?: string | number;
        date?: string;
      };

    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    if (!trip.createdBy.equals(req.user._id)) {
      res.status(403).json({ message: "Only the trip creator can update trip details" });
      return;
    }

    if (!title || !destination || !pickupLocation) {
      res.status(400).json({ message: "Title, destination, and pickup location are required" });
      return;
    }

    if (budget && (isNaN(Number(budget)) || Number(budget) < 0)) {
      res.status(400).json({ message: "Budget must be a positive number" });
      return;
    }

    if (date && !isValidDate(date)) {
      res.status(400).json({ message: "Date should be in Month-Year format (e.g., December-2024)" });
      return;
    }

    trip.title = title;
    trip.description = description;
    trip.destination = destination;
    trip.pickupLocation = pickupLocation;
    trip.budget = budget ? Number(budget) : undefined;
    trip.date = date || undefined;

    await trip.save();
    await trip.populate("members", "name email");
    await trip.populate("createdBy", "name email");

    res.status(200).json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(400).json({ message: "Error updating trip", error: (error as Error).message });
  }
};

function isValidDate(dateString: string): boolean {
  const patterns = [
    /^(January|February|March|April|May|June|July|August|September|October|November|December)-\d{4}$/i,
    /^\d{4}-(0[1-9]|1[0-2])$/,
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}$/i,
  ];
  return patterns.some((pattern) => pattern.test(dateString));
}