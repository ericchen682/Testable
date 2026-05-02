import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from 'react-bootstrap/card';

function Flashcard() {
    return(
        <Card style={{ width: '18rem' }}>
            <Card.Body>
                <Card.Title>Test title</Card.Title>
                <Card.Text>Test text</Card.Text>
            </Card.Body>
        </Card>
    )
}

export default Flashcard;