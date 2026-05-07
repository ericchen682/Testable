import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from 'react-bootstrap/card';

interface FlashcardProps {
    titleText: string;
    frontText: string;
    backText: string;
}

function Flashcard({ titleText, frontText, backText }: FlashcardProps) {
    const [isFlipped, setFlipped] = React.useState(false);
    const displayText = isFlipped ? backText : frontText;
    const bgColor = isFlipped ? "#56B6C6" : "#EFE3CA";
    const textColor = "#170C79"; 
    return(
        <Card style={{ width: '25rem', height: '12rem', backgroundColor: bgColor, borderRadius: "1rem"}} onClick={() => setFlipped(!isFlipped)}>
            <Card.Body>
                <Card.Title style = {{ color: textColor }}>{titleText}</Card.Title>
                <Card.Text style = {{ color: textColor }}>{displayText}</Card.Text>
            </Card.Body>
        </Card>
    )
}

export default Flashcard;