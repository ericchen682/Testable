import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Flashcard from './Flashcard';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar'

interface FlashcardProps {
    titleText: string;
    frontText: string;
    backText: string;
}

interface FlashcardSetProps {
    flashcardList: FlashcardProps[];
}

function FlashcardSet({ flashcardList }: FlashcardSetProps)
{
    const [currCard, setCard] = React.useState(0);
    const setSize = flashcardList.length;
    return(
        <>
            <Flashcard 
                titleText={flashcardList[currCard].titleText} 
                frontText={flashcardList[currCard].frontText} 
                backText={flashcardList[currCard].backText}>
            </Flashcard>
            {
                currCard > 0 && <Button
                    onClick={() => setCard(currCard-1)}
                    >
                    Previous
                </Button>
            }
            <ProgressBar 
                now={((currCard+1)*100)/setSize} 
                label={`${currCard+1}/${setSize}`}
            >
            </ProgressBar>
            {
                currCard < (setSize-1) && <Button
                    onClick={() => setCard(currCard+1)}
                    >
                    Next
                </Button>
            }
        </>
    );
}

export default FlashcardSet;