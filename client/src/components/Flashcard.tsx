import Card from 'react-bootstrap/Card';
import 'bootstrap/dist/css/bootstrap.min.css'

interface FlashcardProps {
    id:string;
    titleText: string;
    frontText: string;
    backText: string;
    isFlipped?: boolean;
    onClick?: () => void;
}

const FONTS = {
    serif: '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
    mono:  '"JetBrains Mono", "IBM Plex Mono", monospace',
    grotesk: '"Space Grotesk", "Inter", system-ui, sans-serif',
};

function Flashcard({ titleText, frontText, backText, isFlipped, onClick }: FlashcardProps) {
    // const [isFlipped, setFlipped] = React.useState(false);
    const displayText = isFlipped ? backText : frontText;
    const bgColor = "#f3e8d4";
    const textColor = "#1a254f"; 

    return(
        <Card 
            style = {{ 
                width: '45rem', 
                height: '24.3rem', 
                backgroundColor: bgColor, 
                borderRadius: "1rem", 
                cursor: 'pointer', 
                padding: '1rem 1.25rem',
                boxSizing: "border-box",
                boxShadow: '0 0 10px 2px rgba(90, 190, 180, 0.6)',
            }} 
            onClick={onClick}
        >
            <Card.Body 
                style = {{ 
                    position: 'relative', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    textAlign: 'center', 
                    height: '100%', 
                }}
            >
                <Card.Title 
                    style = {{ 
                        position: 'absolute',
                        top: '0rem', 
                        left: '0rem', 
                        width : '100%',
                        textAlign: 'center',
                        textTransform: 'uppercase', 
                        color: '#9c9ba5', 
                        fontSize: '1.5rem',
                        fontFamily: FONTS.serif,
                    }}
                >
                    {titleText}
                </Card.Title>
                <Card.Text 
                    style = {{ 
                        color: textColor, 
                        fontSize: isFlipped ? '2.7rem' : '6rem',    
                        fontFamily: FONTS.serif, 
                    }}
                >
                    {displayText}
                </Card.Text>
                <Card.Footer
                    style = {{ 
                        position: 'absolute',
                        bottom: '0rem', 
                        left: '0rem', 
                        width : '100%',
                        textAlign: 'center',
                        textTransform: 'uppercase', 
                        color: '#9c9ba5', 
                        fontSize: '1.5rem',
                        fontFamily: FONTS.serif,
                        backgroundColor: 'transparent',
                        border: 'none',
                    }}
                >
                    Click To Flip
                </Card.Footer>
            </Card.Body>
        </Card>
    )
}

export default Flashcard;
