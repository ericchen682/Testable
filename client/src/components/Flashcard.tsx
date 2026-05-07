import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from 'react-bootstrap/Card';

interface FlashcardProps {
    titleText: string;
    frontText: string;
    backText: string;
}

const FONTS = {
    serif: '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
    mono:  '"JetBrains Mono", "IBM Plex Mono", monospace',
    grotesk: '"Space Grotesk", "Inter", system-ui, sans-serif',
};

function Flashcard({ titleText, frontText, backText }: FlashcardProps) {
    const [isFlipped, setFlipped] = React.useState(false);
    const displayText = isFlipped ? backText : frontText;
    const bgColor = isFlipped ? "#56B6C6" : "#EFE3CA";
    const textColor = "#170C79"; 
    
    const textFont = isFlipped ? FONTS.grotesk : FONTS.serif;

    return(
        <Card 
            style = {{ 
                width: '25rem', 
                height: '12rem', 
                backgroundColor: bgColor, 
                borderRadius: "1rem", 
                cursor: 'pointer', 
                padding: '1rem 1.25rem' 
            }} 
            onClick={() => setFlipped(!isFlipped)}
        >
            <Card.Body 
                style = {{ 
                    position: 'relative', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'flex-start', 
                    textAlign: 'left', 
                    height: '100%', 
                }}
            >
                <Card.Title 
                    style = {{ 
                        position: 'absolute', 
                        top: '0rem', 
                        left: '0rem', 
                        textTransform: 'uppercase', 
                        color: textColor, 
                        fontSize: '1rem',
                        fontFamily: FONTS.mono,
                    }}
                >
                    {titleText}
                </Card.Title>
                <Card.Text 
                    style = {{ 
                        color: textColor, 
                        fontSize: isFlipped ? '1.5rem' : '3rem',    
                        fontFamily: textFont, 
                    }}
                >
                    {displayText}
                </Card.Text>
            </Card.Body>
        </Card>
    )
}

export default Flashcard;