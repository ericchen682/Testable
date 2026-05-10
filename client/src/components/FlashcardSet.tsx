import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Flashcard from './Flashcard';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar'
import 'bootstrap/dist/css/bootstrap.min.css'

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

function FlashcardSet({ flashcardList }: FlashcardSetProps)
{
    const [isFlipped, setFlipped] = React.useState(false);
    const [currCard, setCard] = React.useState(0);
    const setSize = flashcardList.length;
    return(
        <>
            <Flashcard 
                titleText={flashcardList[currCard].titleText} 
                frontText={flashcardList[currCard].frontText} 
                backText={flashcardList[currCard].backText}
                isFlipped={isFlipped}
                onClick={() => setFlipped(!isFlipped)}
            >
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
                            color:"#170C79",
                            borderWidth:"0px",
                            borderRadius:"1.5rem",
                            width: "3rem",
                            height: "3rem",
                            visibility: currCard > 0 ? "visible" : "hidden",
                            cursor: 'pointer', 
                        }}
                        
                        onClick={() => {
                            setCard(currCard-1);
                            setFlipped(false);
                        }}
                        >
                        ←
                    </Button>
                }
                <ProgressBar
                    style = {{
                        // borderWidth:"1px",
                        width:"15rem",
                        height:"1.5rem",
                        borderRadius:"0.75rem",
                        // @ts-expect-error - custom CSS properties
                        "--bs-progress-bg": "rgba(239,227,202,0.18)",
                        "--bs-progress-bar-bg": "#56B6C6",
                    }}
                    now = {((currCard+(isFlipped ? 1 : 0.5))*100)/setSize} 
                    // label = {`${currCard+1}/${setSize}`}
                >
                </ProgressBar>
                {
                    <Button
                        style = {{
                            backgroundColor:"#56B6C6",
                            color:"#170C79",
                            borderWidth:"0px",
                            borderRadius:"1.5rem",
                            width: "3rem",
                            height: "3rem",
                            visibility: currCard+1 < setSize ? "visible" : "hidden",
                            cursor: 'pointer', 
                        }}
                        onClick={() => {
                            setCard(currCard+1);
                            setFlipped(false);
                        }}
                        >
                        →
                    </Button>
                }
            </div>
        </>
    );
}

export default FlashcardSet;