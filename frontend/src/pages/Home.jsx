// frontend/src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModernBuildings from '../assets/hero-bg.jpg';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br  ">
        {/* Optional: Add a pattern overlay for texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIzIDAgMi4xOTguOTY5IDIuMTk4IDIuMlYyMmg1LjY0OGMxLjIzIDAgMi4xOTkuOTcgMi4xOTkgMi4yIDAgMS4yMzItLjk2OSAyLjItMi4xOTkgMi4yaC01LjY0OHYxLjhjMCAxLjIzMi0uOTY5IDIuMi0yLjE5OCAyLjJzLTIuMTk5LS45NjgtMi4xOTktMi4yVjI2LjRoLTUuNjQ4Yy0xLjIzIDAtMi4xOTktLjk2OC0yLjE5OS0yLjIgMC0xLjIzLjk2OS0yLjIgMi4xOTktMi4yaDUuNjQ4di0xLjhjMC0xLjIzMS45NjktMi4yIDIuMTk5LTIuMnoiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
      </div>

      {/* Hero Background Image */}
      <div className="absolute inset-0 z-[-1]">
        <img
          src={ModernBuildings}
          alt="Modern buildings"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Navbar with glass effect */}
      <nav className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-10">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-primary mr-2"
          >
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198c.031-.028.062-.056.091-.086L12 5.43z" />
          </svg>
          <h1 className="text-primary text-2xl font-extrabold">
            Angaza <span className="hidden sm:inline">Real Estate</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-900 transition-colors duration-300 font-medium"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section with Animation */}
      <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 lg:px-8 animate-fadeIn">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl text-white font-bold drop-shadow-lg tracking-tight leading-tight mb-6">
            Modern Property Management Made Simple
          </h1>
          <p className="text-lg md:text-2xl text-white mt-4 drop-shadow-lg mb-8 max-w-2xl mx-auto">
            Streamline your real estate operations with our comprehensive
            management system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-blue-900 text-white px-8 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/40 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <span className="text-white text-sm md:text-base">
                Property Management
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-white text-sm md:text-base">
                Tenant Management
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-white text-sm md:text-base">
                Financial Management
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
