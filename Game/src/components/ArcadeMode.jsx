"use client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";

import "./ArcadeMode.css";



const saveGameHistory = async (gameData) => {
  try {
    const response = await fetch("https://simpcrick8-backend.onrender.com/game-history/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameData),
    });

    const data = await response.json();
    if (!data.success) {
      console.error("Error saving game history:", data.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};


const countries = [
  { name: "India", color: "blue", teamName: "India" },
  { name: "Pakistan", color: "green", teamName: "Pakistan" },
  { name: "Australia", color: "yellow", teamName: "Australia" },
  { name: "England", color: "skyblue", teamName: "England" },
  { name: "New Zealand", color: "black", teamName: "NEw Zealand" },
  { name: "West Indies", color: "maroon", teamName: "West Indies" },
  { name: "South Africa", color: "darkgreen", teamName: "South Africa" },
  { name: "Sri Lanka", color: "royalblue", teamName: "Sri Lanka" },
];

const scoreOptions = [
  { value: 3, color: "orange" },
  { value: 1, color: "yellow" },
  { value: 4, color: "blue" },
  { value: 6, color: "emerald" },
  { value: "W", color: "red" },
  { value: ".", color: "gray" },
  { value: 2, color: "pink" },
];

const speeds = ["FAST", "MEDIUM", "SLOW"];

export default function ArcadeGame() {
  const [myTeam, setMyTeam] = useState(null);
  const [opponentTeam, setOpponentTeam] = useState(null);
  const [gameState, setGameState] = useState({
    targetScore: 0,
    currentScore: 0,
    ballsRemaining: 0,
    matchNumber: 1,
    isGameOver: false,
    gameResult: "",
    ballSpeed: "MEDIUM",
    isAnimating: false,
    pointerPosition: 0,
    isPointerMoving: false,
  });

  useEffect(() => {
    const storedCountry = JSON.parse(localStorage.getItem("selectedCountry"));
    if (storedCountry) {
      setMyTeam(storedCountry);
      const availableOpponents = countries.filter(c => c.name !== storedCountry.name);
      setOpponentTeam(availableOpponents[Math.floor(Math.random() * availableOpponents.length)]);
    }
    initializeGame();
  }, []);

  useEffect(() => {
    let interval;
    if (!gameState.isGameOver && !gameState.isAnimating && gameState.isPointerMoving) {
      const speedIntervals = {
        FAST: 110,   // Slightly slower than 100ms for smoother cycling
        MEDIUM: 200,
        SLOW: 300,
      };
      const intervalTime = speedIntervals[gameState.ballSpeed] || 200;

      interval = setInterval(() => {
        setGameState(prev => {
          const nextPosition = (prev.pointerPosition + 1) % scoreOptions.length;

          return {
            ...prev,
            pointerPosition: nextPosition
          };
        });
      }, intervalTime);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.isGameOver, gameState.isAnimating, gameState.isPointerMoving, gameState.ballSpeed]);

  const initializeGame = () => {
    const ballsRemaining = Math.floor(Math.random() * 9) + 1;
    const targetScore = Math.floor(Math.random() * (ballsRemaining * 6 - 5)) + 5;

    setGameState({
      targetScore,
      ballsRemaining,
      currentScore: 0,
      matchNumber: 1,
      isGameOver: false,
      gameResult: "",
      ballSpeed: speeds[Math.floor(Math.random() * speeds.length)],
      isAnimating: false,
      pointerPosition: 0,
      isPointerMoving: true,
    });
  };

  const handlePointerStop = () => {
    if (gameState.isGameOver || gameState.isAnimating || !gameState.isPointerMoving) return;

    setGameState(prev => ({
      ...prev,
      isPointerMoving: false,
      isAnimating: true
    }));

    const selectedScore = scoreOptions[gameState.pointerPosition].value;

    if (selectedScore === "W") {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          isGameOver: true,
          gameResult: "OUT! Game Over",
          isAnimating: false,
        }));
        if (myTeam && opponentTeam) {
          saveGameHistory({
            myTeam: myTeam.teamName,
            opponentTeam: opponentTeam.teamName,
            targetScore: gameState.targetScore,
            currentScore: gameState.currentScore, // No new runs added
            ballsRemaining: gameState.ballsRemaining - 1,
          });
        }
      },
        50);
      return;
    }

    const newScore = gameState.currentScore + (selectedScore === "." ? 0 : Number(selectedScore));
    const ballsLeft = gameState.ballsRemaining - 1;

    let result = "";
    let gameOver = false;

    if (newScore >= gameState.targetScore) {
      result = "Victory! You won!!!";
      gameOver = true;
    } else if (ballsLeft === 0) {
      result = "Game Over! Target not reached";
      gameOver = true;
    }

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentScore: newScore,
        ballsRemaining: ballsLeft,
        isGameOver: gameOver,
        gameResult: result,
        isAnimating: false,
        ballSpeed: speeds[Math.floor(Math.random() * speeds.length)],
        isPointerMoving: !gameOver,
      }));

      if (gameOver && myTeam && opponentTeam) {
        saveGameHistory({
          myTeam: myTeam.teamName,
          opponentTeam: opponentTeam.teamName,
          targetScore: gameState.targetScore,
          currentScore: newScore,
          ballsRemaining: ballsLeft,
        });
      }
    },
      50);
  };

  return (
    <div className="arcade-container">
      <div className="header">
        <Link to="/">
          <button className="home-button">🏠 Home</button>
        </Link>
        <h1 className="match-heading">
          {myTeam && opponentTeam ? `${myTeam.teamName} vs ${opponentTeam.teamName}` : "Loading Match..."}
        </h1>
        <div className="score-display">
          TEAM: {myTeam ? myTeam.teamName : "Unknown"} | SCORE: {gameState.currentScore}
        </div>
      </div>

      <div className="cricket-field">
        <div className="pitch">
          <div className="batsman" style={{ backgroundColor: myTeam ? myTeam.color : "#000" }} />
          {gameState.isAnimating && (
            <div className="ball-container">
              <div
                className="score-display-animation"
                style={{
                  backgroundColor: scoreOptions[gameState.pointerPosition].color,
                  animationDuration:
                    gameState.ballSpeed === "FAST" ? "0.3s" :
                      gameState.ballSpeed === "MEDIUM" ? "0.5s" :
                        "0.7s"
                }}
              >
                {scoreOptions[gameState.pointerPosition].value}
              </div>
            </div>
          )}


          <div className="bowler" style={{ backgroundColor: opponentTeam ? opponentTeam.color : "#fff" }} />
          {gameState.isGameOver && <div className="game-message">{gameState.gameResult}</div>}
        </div>
      </div>

      <div className="game-info">
        <div className="target-info">NEED: {Math.max(0, gameState.targetScore - gameState.currentScore)}</div>
        <div className="balls-info">FROM: {gameState.ballsRemaining}</div>
      </div>

      <div className="speed-indicator">{gameState.ballSpeed}</div>
      <div className="adding-help">
        <div className="score-options-container" onClick={handlePointerStop}>
          <div
            className="pointer"
            style={{
              left: `${(gameState.pointerPosition * 100) / scoreOptions.length}%`,
              width: `${100 / scoreOptions.length}%`,
              transition: gameState.ballSpeed === "FAST" ? "left 0.1s ease-in-out" : "left 0.2s ease-in-out"
            }}
          />
          <div className="score-options">
            {scoreOptions.map((option, index) => (
              <div
                key={index}
                className={`score-button ${option.color}`}
              >
                {option.value}
              </div>
            ))}
          </div>

        </div>
        <div className="help-button-container">
          <button className="help-button">
            <HelpCircle className="w-8 h-8" />
          </button>
        </div>
      </div>

      {gameState.isGameOver && (
        <div className="play-again-container">
          <button onClick={initializeGame} className="play-again-button">Play Again</button>
        </div>
      )}
    </div>
  );
}
