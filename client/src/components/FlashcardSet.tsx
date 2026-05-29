import React from 'react';
import Flashcard from './Flashcard';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar'
import 'bootstrap/dist/css/bootstrap.min.css'

interface FlashcardProps {
    id:string;
    titleText: string;
    frontText: string;
    backText: string;
    isFlipped?: boolean;
    onClick?: () => void;
    
}

interface FlashcardSetProps {
    flashcardList: FlashcardProps[];
    setId: string;
    token: string;
}

function FlashcardSet({ flashcardList, setId, token }: FlashcardSetProps)
{
    const [isFlipped, setFlipped] = React.useState(false);
    const [currCard, setCard] = React.useState(0);
    const setSize = flashcardList.length;
    const [hoveredBtn, setHoveredBtn] = React.useState<'wrong' | 'correct' |
    null>(null);
    const [cardShownAt, setCardShownAt] = React.useState(Date.now());
    const recordAnswer = async (correct: boolean) => {
        const timeSpent = Date.now() - cardShownAt;
        const card = flashcardList[currCard];
        try {
            await fetch('http://localhost:3001/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cardId: card.id,
                    setId,
                    correct,
                    timeSpent,
                }),
            });
        } catch {
            // fire and forget, don't block UI
        }
    };
    return(
        <div
            style = {{
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
            }}
        >
            <Flashcard 
                id = {flashcardList[currCard].id} 
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
                    <div style={{ width: "3rem", height: "3rem" }} /> 
                }
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
            </div>
            <div style = {{ display: "flex", gap: "1rem"}}>
                <Button
                    onMouseEnter={() => setHoveredBtn('wrong')}                          
                    onMouseLeave={() => setHoveredBtn(null)}       
                    style = {{
                        border: "2px solid #56B6C6",
                        backgroundColor: hoveredBtn === 'wrong' ? '#FF3131' : '#FFFFFF',
                        color: hoveredBtn === 'wrong' ? '#FFFFFF' : '#FF3131',
                        // borderWidth:"0px",
                        borderRadius:"0.5rem",
                        width: "4rem",
                        height: "3rem",
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        recordAnswer(false);
                        if (currCard + 1 < setSize) {
                            setCard(currCard + 1);
                        }
                        setCardShownAt(Date.now());
                        setFlipped(false);
                    }}
                    >
                    X
                </Button>

                <Button
                    onMouseEnter={() => setHoveredBtn('correct')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style = {{
                        border: "2px solid #56B6C6",
                        backgroundColor: hoveredBtn === 'correct' ? '#39FF14' :'#FFFFFF',
                        color: hoveredBtn === 'correct' ? '#FFFFFF' : '#39FF14',
                        // borderWidth:"0px",
                        borderRadius:"0.5rem",
                        width: "4rem",
                        height: "3rem",
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        recordAnswer(true);
                        if (currCard + 1 < setSize) {
                            setCard(currCard + 1);
                        }
                        setCardShownAt(Date.now());
                        setFlipped(false);
                    }}
                    >
                    ✓
                </Button>
                    
            </div>
        </div>
    );
}

export default FlashcardSet;
