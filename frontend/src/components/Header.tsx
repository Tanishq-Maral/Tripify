import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  // return (
  //   <header className="bg-white shadow">
  //     <div className="container mx-auto p-4 flex items-center">
  //       <Link to="/" className="font-bold text-xl">Tripifyyy</Link>
  //       <nav className="ml-auto flex gap-4">
  //         {/* {user && <Link to="/add-trip">Add Trip</Link>} */}
  //         {user ? (
  //           <button onClick={() => { 
  //             logout(); 
  //             nav("/"); // redirect to Home after logout
  //           }}>
  //             Logout
  //           </button>
  //         ) : (
  //           <Link to="/auth">Login</Link>
  //         )}
  //       </nav>
  //     </div>
  //   </header>
  // );
}