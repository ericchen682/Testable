import { useState } from 'react';
import Flashcard from './components/Flashcard';
import FlashcardSet from './components/FlashcardSet';
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

interface FlashcardProps {
    titleText: string;
    frontText: string;
    backText: string;
    isFlipped?: boolean;
    onClick?: () => void;
}

interface FlashcardSetProps {
    flashcardList: FlashcardProps[];
}

function App() {
  const mockData: FlashcardSetProps = { 
    flashcardList: [
    {titleText: "title", frontText: "first card", backText: "first card back text"},
    {titleText: "title", frontText: "second card", backText: "second card back text"},
    {titleText: "title", frontText: "third card", backText: "third card back text"},
    {titleText: "title", frontText: "fourth card", backText: "fourth card back text"},
    {titleText: "title", frontText: "fifth card", backText: "fifth card back text"},
    ]
  };
  return (
    <FlashcardSet 
      flashcardList={mockData.flashcardList}
    >
    </FlashcardSet>
  );
}

export default App
