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
            <div
                style = {{
                    display:"flex",
                    width:"27rem",
                    boxSizing:"border-box",
                    justifyContent:"space-between",
                    alignItems:"center",
                    padding:"0.5rem 0",
                }}
            >
                {
                    <Button
                        style = {{
                            backgroundColor:"#56B6C6",
                            borderWidth:"0px",
                            borderRadius:"1.5rem",
                            width: "3rem",
                            height: "3rem",
                            visibility: currCard > 0 ? "visible" : "hidden",
                            cursor: 'pointer', 
                        }}
                        
                        onClick={() => setCard(currCard-1)}
                        >
                        ←
                    </Button>
                }
                <ProgressBar 
                    now={((currCard+1)*100)/setSize} 
                    label={`${currCard+1}/${setSize}`}
                >
                </ProgressBar>
                {
                    <Button
                        style = {{
                            backgroundColor:"#56B6C6",
                            borderWidth:"0px",
                            borderRadius:"1.5rem",
                            width: "3rem",
                            height: "3rem",
                            visibility: currCard+1 < setSize ? "visible" : "hidden",
                            cursor: 'pointer', 
                        }}
                        onClick={() => setCard(currCard+1)}
                        >
                        →
                    </Button>
                }
            </div>
        </>
    );
}

export default FlashcardSet;