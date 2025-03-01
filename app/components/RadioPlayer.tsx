"use client";
import React, { useState, useEffect } from "react";
import { RadioBrowserApi } from "radio-browser-api";

function RadioPlayer() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [stations, setStations] = useState<any[]>([]);
  const [playingStation, setPlayingStation] = useState<any>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadLimit, setLoadLimit] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>("name");
  console.log("sortBy: ", sortBy);

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://de1.api.radio-browser.info/json/stations/search?name=${searchTerm}&limit=${loadLimit}&order=${sortBy}`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        if (sortBy === "votes") {
          data.sort((a: any, b: any) => b.votes - a.votes);
        }
        setStations(data);
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStations();
  }, [searchTerm, loadLimit, sortBy]);

  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audio]);

  useEffect(() => {
    // Load favorites from localStorage on mount
    const savedFavorites = JSON.parse(localStorage.getItem("favoriteStations") || "[]");
    setFavorites(savedFavorites);
  }, []);

  // Add event listeners to track audio playing state
  useEffect(() => {
    if (audio) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, [audio]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Reset load limit when searching
    setLoadLimit(10);
  };

  const handlePlay = (station: any) => {
    if (playingStation && station.id === playingStation.id) {
      if (audio) {
        if (isPlaying) {
          audio.pause();
        } else {
          audio.play().catch((error) => {
            console.error("Error playing audio:", error);
          });
        }
      }
      return;
    }

    if (audio) {
      audio.pause();
      audio.src = "";
    }

    const newAudio = new Audio(station.urlResolved);
    newAudio.crossOrigin = "anonymous";
    setAudio(newAudio);
    setPlayingStation(station);

    newAudio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  };

  const handleStop = () => {
    if (audio) {
      audio.pause();
      audio.src = "";
      setPlayingStation(null);
      setIsPlaying(false);
    }
  };

  const isStationFavorite = (station: any) => {
    const favoritess = favorites.some((fav) => fav.id === station.id);
    console.log("favoritess: ", favoritess);
    return favorites.some((fav) => fav.id === station.id);
  };

  const saveToFavorites = (station: any) => {
    // Check if station is already in favorites first
    if (isStationFavorite(station)) {
      removeFromFavorites(station);
    } else {
      const updatedFavorites = [...favorites, station].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
      setFavorites(updatedFavorites);
      localStorage.setItem("favoriteStations", JSON.stringify(updatedFavorites));
    }
  };

  const removeFromFavorites = (station: any) => {
    console.log("favorites: ", favorites);
    const updatedFavorites = favorites.filter((fav) => fav.id !== station.id);
    setFavorites(updatedFavorites);
    localStorage.setItem("favoriteStations", JSON.stringify(updatedFavorites));
  };

  const loadMoreStations = () => {
    setLoadLimit((prevLimit) => prevLimit + 10);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <span className="mr-3">StreamRadio</span>
            <span className="relative w-8 h-8">
              <span className="absolute animate-ping w-full h-full rounded-full bg-pink-400 opacity-30"></span>
              <span className="absolute w-full h-full rounded-full bg-pink-500 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </span>
          </h1>

          {/* Now Playing Indicator */}
          {playingStation && (
            <div className="hidden md:flex items-center bg-white/10 backdrop-blur-md p-3 rounded-full">
              <div className="flex space-x-1 mr-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-4 bg-teal-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  ></div>
                ))}
              </div>
              <span className="text-white text-sm font-medium">Now Playing: {playingStation.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search and Favorites */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                Discover Stations
              </h2>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search by station name..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/50 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
                <div className="absolute left-3 top-3 text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <label htmlFor="sortBy" className="block text-white text-sm mb-2">
                  Sort By:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="w-full py-2 px-3 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                >
                  <option value="name">Name</option>
                  <option value="votes">Votes (Popularity)</option>
                  <option value="clickcount">Click Count</option>
                  <option value="bitrate">Bitrate</option>
                </select>
              </div>

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-center mt-4">
                  <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Favorite Stations */}
            {favorites.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Favorites
                </h2>
                <ul className="space-y-3">
                  {favorites.map((station) => (
                    <li key={station.id} className="bg-white/5 hover:bg-white/10 transition rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-white"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-white text-sm font-medium truncate max-w-xs">{station.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePlay(station)}
                            className={`p-2 rounded-full transition ${
                              playingStation && playingStation.id === station.id
                                ? isPlaying
                                  ? "bg-red-500 hover:bg-red-600"
                                  : "bg-green-500 hover:bg-green-600"
                                : "bg-teal-500 hover:bg-teal-600"
                            }`}
                          >
                            {playingStation && playingStation.id === station.id ? (
                              isPlaying ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => removeFromFavorites(station)}
                            className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Station List */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl h-full">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                    clipRule="evenodd"
                  />
                </svg>
                Radio Stations
                {sortBy === "votes" && <span className="ml-2 text-sm font-normal">(Sorted by popularity)</span>}
              </h2>

              {stations.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stations.map((station) => {
                      // Get individual favorite status for this specific station
                      const isFavorite = isStationFavorite(station);
                      // Get individual playing status for this specific station
                      const isThisStationPlaying = playingStation && playingStation.id === station.id;

                      return (
                        <div
                          key={station.id}
                          className="bg-white/5 hover:bg-white/10 transition rounded-lg overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-center mb-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mr-3">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="font-bold text-white truncate">{station.name}</h3>
                                <div className="flex items-center">
                                  {station.votes && (
                                    <span className="text-xs text-white/60 flex items-center mr-2">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3 w-3 mr-1"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                      </svg>
                                      {station.votes}
                                    </span>
                                  )}
                                  {station.tags && (
                                    <span className="text-xs text-white/60 truncate">{station.tags}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handlePlay(station)}
                                className={`flex-1 py-2 rounded-lg font-medium text-sm transition flex items-center justify-center ${
                                  isThisStationPlaying
                                    ? isPlaying
                                      ? "bg-red-500 text-white hover:bg-red-600"
                                      : "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-teal-500 text-white hover:bg-teal-600"
                                }`}
                              >
                                {isThisStationPlaying ? (
                                  isPlaying ? (
                                    <>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>{" "}
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                          clipRule="evenodd"
                                        />
                                      </svg>{" "}
                                      Play
                                    </>
                                  )
                                ) : (
                                  <>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                        clipRule="evenodd"
                                      />
                                    </svg>{" "}
                                    Play
                                  </>
                                )}
                              </button>

                              {isThisStationPlaying && (
                                <button
                                  onClick={handleStop}
                                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium flex items-center justify-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Stop
                                </button>
                              )}

                              <button
                                onClick={() => saveToFavorites(station)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center ${
                                  isFavorite
                                    ? "bg-rose-500 text-white hover:bg-rose-600"
                                    : "bg-amber-500 text-white hover:bg-amber-600"
                                }`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  {isFavorite ? (
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  ) : (
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  )}
                                </svg>
                                {isFavorite ? "Remove" : "Favorite"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load More Button */}
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={loadMoreStations}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Load More
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="bg-white/5 p-6 rounded-lg inline-block mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-indigo-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2">No Stations Found</h3>
                  <p className="text-white/60">
                    Try a different search term or clear your search to see popular stations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RadioPlayer;
