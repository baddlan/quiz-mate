import { Component } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import CenterBox from "../../components/CenterBox";
import RemoteTimer from "../../components/Timer/RemoteTimer";
import { answerSelected } from "../../connection/config";
import { V_WAITING } from "./views";
import { toLetter } from "../../utilities";

import "./Question.css";

class Question extends Component {

    answer(answer, index) {
        return (
            <Col md={6} sm={12} key={index}>
                <div className="player-answer" onClick={() => this.selectAnswer(index)}>
                    <div className="player-answer-letter">{toLetter(index)}</div>
                    {answer}
                </div>
            </Col>
        );
    }

    renderTextInput = () => {
        return (
            <Row>
                <Col xs={12}>
                    <div style={{ padding: "1rem" }}>
                        <Form.Control
                            type="text"
                            className="player-text-input"
                            placeholder="Type your answer..."
                            value={this.props.textAnswer}
                            onChange={this.props.onTextChange}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && this.props.textAnswer.trim()) {
                                    this.props.submitTextAnswer();
                                }
                            }}
                            style={{
                                fontSize: "1.2rem",
                                padding: "1rem",
                                marginBottom: "1rem",
                                textAlign: "center"
                            }}
                            autoFocus
                        />
                        <Button
                            variant="success"
                            onClick={this.props.submitTextAnswer}
                            disabled={!this.props.textAnswer.trim()}
                            style={{
                                width: "100%",
                                padding: "1rem",
                                fontSize: "1.2rem",
                                fontWeight: "bold"
                            }}
                        >
                            Submit Answer
                        </Button>
                    </div>
                </Col>
            </Row>
        );
    };

    QuestionGrid = () => {
        const { question } = this.props;
        const questionType = question.type || "multiple-choice";
        return (
            <div>
                <Row>
                    <Col xs={12}>
                        <div className="player-question">
                            {question.question}
                        </div>
                    </Col>
                    {questionType === "multiple-choice" && question.answers.map((answer, index) => this.answer(answer, index))}
                    {questionType === "text-entry" && this.renderTextInput()}
                </Row>
            </div>
        );
    };

    selectAnswer = number => {
        if (this.props.question) {
            this.props.selected(number);
            this.props.socket.emit(
                answerSelected,
                this.props.game.roomCode,
                this.props.game.playerName,
                this.props.question.index,
                number
            );
            this.props.switchState(V_WAITING);
        }
    };

    render() {
        return (
            <CenterBox logo cancel="Exit" {...this.props}>
                <div className="message-box">
                    {this.props.game.hostingRoom.timeLimit > 0 && (
                        <RemoteTimer seconds={this.props.timer} />
                    )}
                    <br />
                    <Container fluid>
                        {this.props.question ? this.QuestionGrid() : false}
                    </Container>
                </div>
            </CenterBox>
        );
    }
}

export default Question;
