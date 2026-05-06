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
    return(
        <Card style={{ width: '18rem' }} onClick={() => setFlipped(!isFlipped)}>
            <Card.Body>
                <Card.Title>{titleText}</Card.Title>
                <Card.Text>{displayText}</Card.Text>
            </Card.Body>
        </Card>
    )
}

export default Flashcard;