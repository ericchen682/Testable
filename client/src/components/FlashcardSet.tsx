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

    const flipCard = () => {
        setFlipped(!isFlipped);
    };

    const goToPrevCard = () => {
        if (currCard > 0)
        {
            setCard(currCard - 1);
            setFlipped(false);
        }
    };

    const goToNextCard = () => {
        if (currCard + 1 < setSize)
        {
            setCard(currCard + 1);
            setFlipped(false);
        }
    };

    const markAnswer = (correct: boolean) => {
        recordAnswer(correct);

        if (currCard + 1 < setSize) {
            setCard(currCard + 1);
        }

        setCardShownAt(Date.now());
        setFlipped(false);
    };

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;

            if (
                target?.tagName === 'INPUT' ||
                target?.tagName === 'TEXTAREA' ||
                target?.tagName === 'SELECT' ||
                target?.isContentEditable
            ) {
                return;
            }

            if(event.code === 'Space') {
                event.preventDefault();
                flipCard();
            }

            if(event.key === 'ArrowLeft') {
                goToPrevCard();
            }

            if(event.key === 'ArrowRight') {
                goToNextCard();
            }

            if(event.key === '1') {
                markAnswer(false);
            }

            if(event.key === '2') {
                markAnswer(true);
            }
        }
    })

    return(
        <div
            style = {{
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "4rem" }}>
                <Button
                    style = {{
                        backgroundColor:"transparent",
                        color:"#079198",
                        fontSize: "8rem",
                        borderWidth:"0px",
                        borderRadius:"1.5rem",
                        width: "6rem",
                        height: "6rem",
                        overflow: "visible",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: "1", 
                        visibility: currCard > 0 ? "visible" : "hidden",
                        cursor: 'pointer',
                        
                    }}     
                    onClick={() => goToPrevCard()}
                >
                    ←
                </Button>

                <Flashcard 
                    id = {flashcardList[currCard].id} 
                    titleText={flashcardList[currCard].titleText} 
                    frontText={flashcardList[currCard].frontText} 
                    backText={flashcardList[currCard].backText}
                    isFlipped={isFlipped}
                    onClick={() => flipCard()}
                >
                </Flashcard>

                <Button
                    style = {{
                        backgroundColor:"transparent",
                        color:"#079198",
                        fontSize: "8rem",
                        borderWidth:"0px",
                        borderRadius:"1.5rem",
                        width: "6rem",
                        height: "6rem",
                        overflow: "visible",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: "1",
                        visibility: currCard+1 < setSize ? "visible" : "hidden",
                        cursor: 'pointer', 
                    }}
                    onClick={() => goToNextCard()}
                    >
                    →
                </Button>
            </div>

            <div
                style = {{
                    display:"flex",
                    width:"27rem",
                    boxSizing:"border-box",
                    justifyContent:"center",
                    alignItems:"center",
                    padding:"0.5rem 0",
                }}
            >
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
                {/* {
                    <div style={{ width: "3rem", height: "3rem" }} /> 
                } */}
            </div>

            <div style = {{ display: "flex", gap: "1rem"}}>
                <button
                    onMouseEnter={() => setHoveredBtn('wrong')}                          
                    onMouseLeave={() => setHoveredBtn(null)}       
                    style = {{
                        border: "2px solid #079198",
                        backgroundColor: hoveredBtn === 'wrong' ? '#ad4e4e' : '#334071',
                        color: hoveredBtn === 'wrong' ? '#334071' : '#ad4e4e',
                        // borderWidth:"0px",
                        borderRadius:"0.5rem",
                        width: "4rem",
                        height: "3rem",
                        cursor: 'pointer',
                    }}
                    onClick={() => markAnswer(false)}
                    >
                    X
                </button>

                <button
                    onMouseEnter={() => setHoveredBtn('correct')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style = {{
                        border: "2px solid #079198",
                        backgroundColor: hoveredBtn === 'correct' ? '#4ead69' :'#334071',
                        color: hoveredBtn === 'correct' ? '#334071' : '#4ead69',
                        // borderWidth:"0px",
                        borderRadius:"0.5rem",
                        width: "4rem",
                        height: "3rem",
                        cursor: 'pointer',
                    }}
                    onClick={() => markAnswer(true)}
                    >
                    ✓
                </button>
            </div>        
        </div>
    );
}

export default FlashcardSet;