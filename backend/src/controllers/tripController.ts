import { Request, Response } from "express";
import Trip from "../models/Trip.js";
import Message from "../models/Message.js";
import CreatorReport from "../models/CreatorReport.js";
import { Types } from "mongoose";

interface FilterQuery {
  $or?: object[];
  destination?: object;
  pickupLocation?: object;
  budget?: object;
  date?: object;
  $expr?: any;
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
        { pickupLocation: { $regex: search, $options: "i" } },
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

    // Filter by startDate month/year using aggregation expressions when provided
    if (month && year) {
      const monthNames = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];
      const monthIndex = monthNames.findIndex((m) => m.startsWith(month.toLowerCase()));
      if (monthIndex !== -1 && !isNaN(Number(year))) {
        query.$expr = {
          $and: [
            { $eq: [{ $month: "$startDate" }, monthIndex + 1] },
            { $eq: [{ $year: "$startDate" }, Number(year)] },
          ],
        };
      }
    } else if (month) {
      const monthNames = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];
      const monthIndex = monthNames.findIndex((m) => m.startsWith(month.toLowerCase()));
      if (monthIndex !== -1) {
        query.$expr = { $eq: [{ $month: "$startDate" }, monthIndex + 1] };
      }
    } else if (year) {
      if (!isNaN(Number(year))) {
        query.$expr = { $eq: [{ $year: "$startDate" }, Number(year)] };
      }
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const trips = await Trip.find(query)
      .populate("members", "name email")
      .populate("createdBy", "name email phone")
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

    if (req.user.role !== "creator") {
      res.status(403).json({ message: "Only creators can create trips" });
      return;
    }

    const { title, description, destination, pickupLocation, budget, startDate, endDate } =
      req.body as {
        title: string;
        description?: string;
        destination: string;
        pickupLocation: string;
        budget?: string | number;
        startDate?: string;
        endDate?: string;
      };

    if (!title || !destination || !pickupLocation) {
      res.status(400).json({ message: "Title, destination, and pickup location are required" });
      return;
    }

    if (budget && (isNaN(Number(budget)) || Number(budget) < 0)) {
      res.status(400).json({ message: "Budget must be a positive number" });
      return;
    }

    if (startDate && !isValidISODate(startDate)) {
      res.status(400).json({ message: "startDate must be a valid date string (ISO)" });
      return;
    }
    if (endDate && !isValidISODate(endDate)) {
      res.status(400).json({ message: "endDate must be a valid date string (ISO)" });
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      res.status(400).json({ message: "startDate cannot be after endDate" });
      return;
    }

    // Ensure startDate is not before today
    if (startDate) {
      const s = new Date(startDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      s.setHours(0,0,0,0);
      if (s < today) {
        res.status(400).json({ message: "startDate must be today or a future date" });
        return;
      }
    }

    // Ensure startDate is not before today
    if (startDate) {
      const s = new Date(startDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      s.setHours(0,0,0,0);
      if (s < today) {
        res.status(400).json({ message: "startDate must be today or a future date" });
        return;
      }
    }

    const trip = await Trip.create({
      title,
      description,
      destination,
      pickupLocation,
      budget: budget ? Number(budget) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
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
      .populate("createdBy", "name email phone");

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
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (req.user.role !== "user") {
      res.status(403).json({ message: "Only users can join trips" });
      return;
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const alreadyMember = trip.members.some((memberId) => String(memberId) === req.user?._id);
    if (!alreadyMember) {
      trip.members.push(new Types.ObjectId(req.user._id));
      await trip.save();
    }

    await trip.populate("members", "name email");
    await trip.populate("createdBy", "name email phone");

    res.status(200).json(trip);
  } catch (error) {
    console.error("Error joining trip:", error);
    res.status(400).json({ message: "Error joining trip", error: (error as Error).message });
  }
};

export const reportTripCreator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body as { reason?: string; notes?: string };

    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: "Report reason is required" });
      return;
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const isMember = trip.members.some((memberId) => String(memberId) === req.user?._id);
    const isCreator = String(trip.createdBy) === req.user?._id;

    if (!isMember || isCreator) {
      res.status(403).json({ message: "Only trip members can report the creator" });
      return;
    }

    await CreatorReport.create({
      trip: trip._id,
      creator: trip.createdBy,
      reporter: req.user._id,
      reason: reason.trim(),
      notes: notes?.trim() || undefined,
    });

    res.status(201).json({ message: "Report submitted successfully" });
  } catch (error) {
    console.error("Error reporting creator:", error);
    res.status(500).json({ message: "Error reporting creator", error: (error as Error).message });
  }
};

export const getFilterOptions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const destinations = await Trip.distinct("destination");
    const pickupLocations = await Trip.distinct("pickupLocation");
    const startDatesRaw = await Trip.distinct("startDate");
    const budgets = await Trip.distinct("budget");

    const dates = (startDatesRaw as (string | Date)[])
      .filter(Boolean)
      .map((d) => {
        const dt = new Date(d as string);
        return `${dt.toLocaleString(undefined, { month: "long" })}-${dt.getFullYear()}`;
      });

    const uniqueDates = Array.from(new Set(dates)).sort();

    res.status(200).json({
      destinations: (destinations as string[]).filter(Boolean).sort(),
      pickupLocations: (pickupLocations as string[]).filter(Boolean).sort(),
      dates: uniqueDates,
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

    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const isMember = trip.members.some((memberId) => String(memberId) === req.user?._id);
    const isCreator = String(trip.createdBy) === req.user?._id;

    if (req.user.role === "user" && !isMember) {
      res.status(403).json({ message: "You must be a member of this trip to view messages" });
      return;
    }

    if (req.user.role === "creator" && !isCreator) {
      res.status(403).json({ message: "Only the trip creator can access this chat" });
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

    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({ message: "Message text is required" });
      return;
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const isMember = trip.members.some((memberId) => String(memberId) === req.user?._id);
    const isCreator = String(trip.createdBy) === req.user?._id;

    if (req.user.role === "user" && !isMember) {
      res.status(403).json({ message: "You must be a member of this trip to send messages" });
      return;
    }

    if (req.user.role === "creator" && !isCreator) {
      res.status(403).json({ message: "Only the trip creator can send messages in this trip" });
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
    const { title, description, destination, pickupLocation, budget, startDate, endDate } =
      req.body as {
        title: string;
        description?: string;
        destination: string;
        pickupLocation: string;
        budget?: string | number;
        startDate?: string;
        endDate?: string;
      };

    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (req.user.role !== "creator") {
      res.status(403).json({ message: "Only creators can manage trips" });
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

    if (startDate && !isValidISODate(startDate)) {
      res.status(400).json({ message: "startDate must be a valid date string (ISO)" });
      return;
    }
    if (endDate && !isValidISODate(endDate)) {
      res.status(400).json({ message: "endDate must be a valid date string (ISO)" });
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      res.status(400).json({ message: "startDate cannot be after endDate" });
      return;
    }

    // Ensure startDate is not before today
    if (startDate) {
      const s = new Date(startDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      s.setHours(0,0,0,0);
      if (s < today) {
        res.status(400).json({ message: "startDate must be today or a future date" });
        return;
      }
    }

    trip.title = title;
    trip.description = description;
    trip.destination = destination;
    trip.pickupLocation = pickupLocation;
    trip.budget = budget ? Number(budget) : undefined;
    trip.startDate = startDate ? new Date(startDate) : undefined;
    trip.endDate = endDate ? new Date(endDate) : undefined;

    await trip.save();
    await trip.populate("members", "name email");
    await trip.populate("createdBy", "name email phone");

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

function isValidISODate(dateString: string): boolean {
  const d = new Date(dateString);
  return !isNaN(d.getTime());
}

export const removeTripMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;

    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (req.user.role !== "creator") {
      res.status(403).json({ message: "Only creators can remove members" });
      return;
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    if (!trip.createdBy.equals(req.user._id)) {
      res.status(403).json({ message: "You can only remove members from trips you created" });
      return;
    }

    if (String(trip.createdBy) === memberId) {
      res.status(400).json({ message: "Trip creator cannot be removed" });
      return;
    }

    const beforeCount = trip.members.length;
    trip.members = trip.members.filter((existingMemberId) => String(existingMemberId) !== memberId);

    if (trip.members.length === beforeCount) {
      res.status(404).json({ message: "User is not a member of this trip" });
      return;
    }

    await trip.save();
    await trip.populate("members", "name email");
    await trip.populate("createdBy", "name email phone");

    res.status(200).json(trip);
  } catch (error) {
    console.error("Error removing trip member:", error);
    res.status(500).json({ message: "Error removing trip member", error: (error as Error).message });
  }
};