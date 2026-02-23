'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface TourStep {
    targetId?: string; // ID of the element to point to (optional, if we want to position it)
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const steps: TourStep[] = [
    {
        title: "Welcome to Live Sports! 🎉",
        content: "Experience the game like never before. Let's take a quick tour of our brand new features.",
        position: 'center',
    },
    {
        title: "Tap to Watch & Unmute 🔊",
        content: "Simply tap the video player once to start the stream with sound.",
        position: 'center', // Can attach to video player
    },
    {
        title: "Live Event Chat 💬",
        content: "Chat with other fans in real-time. Click 'Show Chat' below to open the chat window.",
        position: 'bottom',
    },
    {
        title: "Support Your Team 👍",
        content: "Like, Dislike, or Share the stream with your friends using the action bar.",
        position: 'bottom',
    },
    {
        title: "Immersive Fullscreen 📺",
        content: "Click the fullscreen icon to watch the game across your entire screen while chatting!",
        position: 'bottom',
    }
];

export default function TourGuide() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already seen the tour
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
            setIsVisible(true);
        }
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        // Auto transition to next step every 4 seconds
        const timer = setTimeout(() => {
            if (currentStep < steps.length - 1) {
                setCurrentStep((prev: number) => prev + 1);
            } else {
                finishTour();
            }
        }, 4000); // Wait 4s before moving so they have time to read

        return () => clearTimeout(timer);
    }, [currentStep, isVisible]);

    const finishTour = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenTour', 'true');
    };

    if (!isVisible) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[1px] transition-all duration-300">
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-blue-500/30 text-white rounded-2xl p-6 shadow-2xl relative max-w-sm w-full mx-4 transform transition-all duration-300 pointer-events-auto">

                {/* Close Button */}
                <button
                    onClick={finishTour}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                >
                    <FaTimes />
                </button>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-1.5 mb-5">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-6 bg-blue-500' : 'w-2 bg-gray-600'}`}
                        />
                    ))}
                </div>

                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    {step.title}
                </h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    {step.content}
                </p>

                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={finishTour}
                        className="text-gray-400 hover:text-white text-sm font-semibold transition"
                    >
                        Skip Tour
                    </button>

                    <button
                        onClick={() => {
                            if (currentStep < steps.length - 1) {
                                setCurrentStep((prev: number) => prev + 1);
                            } else {
                                finishTour();
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                    >
                        {currentStep < steps.length - 1 ? 'Next' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
}
