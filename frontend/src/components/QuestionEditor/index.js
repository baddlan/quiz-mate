import React, { Component } from "react";
import { Button, Container, Form, InputGroup, Row } from "react-bootstrap";
import DeleteForever from "../../assets/icons/delete_forever.svg";
import ImageIcon from "../../assets/icons/image.svg";
import "../../assets/icons/material-ui-icon.css";
import RadioButtonCheckedIcon from '../../assets/icons/radio_button_checked.svg';
import RadioButtonUncheckedIcon from '../../assets/icons/radio_button_unchecked.svg';
import { toLetter } from "../../utilities";
import "./QuestionEditor.css";

const MAX_ANSWERS = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

class QuestionEditor extends Component {

    constructor(props) {
        super(props);
        this.onQuestionTextChange = this.onQuestionTextChange.bind(this);
        this.onImageChange = this.onImageChange.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.toggleQuestionType = this.toggleQuestionType.bind(this);
        this.addReferenceAnswer = this.addReferenceAnswer.bind(this);
        this.removeReferenceAnswer = this.removeReferenceAnswer.bind(this);
    }

    onQuestionTextChange(event) {
        this.updateQuestion(event.target.value);
    }

    updateQuestion(value) {
        this.props.update({ ...this.props.question, question: value });
    }

    setCorrectAnswerIndex(value) {
        this.props.update({ ...this.props.question, correct: value });
    }

    updateAnswer(index, value) {
        const newData = this.props.question.answers.slice();
        newData[index] = value;
        this.props.update({ ...this.props.question, answers: newData });
    }

    toggleQuestionType(type) {
        if (type === "text-entry") {
            this.props.update({
                ...this.props.question,
                type: "text-entry",
                referenceAnswers: this.props.question.referenceAnswers || [],
                answers: undefined,
                correct: undefined
            });
        } else {
            this.props.update({
                ...this.props.question,
                type: "multiple-choice",
                answers: this.props.question.answers || ['', '', '', ''],
                correct: this.props.question.correct || 0,
                referenceAnswers: undefined
            });
        }
    }

    updateReferenceAnswer(index, value) {
        const newData = [...(this.props.question.referenceAnswers || [])];
        newData[index] = value;
        this.props.update({ ...this.props.question, referenceAnswers: newData });
    }

    addReferenceAnswer() {
        const referenceAnswers = [...(this.props.question.referenceAnswers || []), ''];
        this.props.update({ ...this.props.question, referenceAnswers });
    }

    removeReferenceAnswer(index) {
        const referenceAnswers = (this.props.question.referenceAnswers || []).filter((_, i) => i !== index);
        this.props.update({ ...this.props.question, referenceAnswers });
    }

    onImageChange(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > MAX_IMAGE_SIZE) {
                alert("Image size must be less than 5MB"); // NOSONAR
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                this.props.update({
                    ...this.props.question,
                    imageUrl: reader.result,
                });
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        this.props.update({ ...this.props.question, imageUrl: null });
    }

    getMarkCorrectAnswerCallback(index) {
        return () => this.setCorrectAnswerIndex(index);
    }

    getUpdateAnswerCallback(index) {
        return (event => this.updateAnswer(index, event.target.value));
    }

    answerBox(answer) {
        const icon = answer === this.props.question.correct ? RadioButtonCheckedIcon : RadioButtonUncheckedIcon;
        return (
            <Row key={answer}>
                <div className="answer-row">
                    <InputGroup>
                        <Button variant="secondary" onClick={this.getMarkCorrectAnswerCallback(answer)}>
                            <img src={icon}
                                className="material-ui-icon answer-checkbox"
                                alt="Mark as correct answer" />
                            <span className="answer-letter">{toLetter(answer)}</span>
                        </Button>
                        <Form.Control type="text"
                            value={this.props.question.answers[answer]}
                            className={
                                "editor-text-box"
                                + (answer === this.props.question.correct ? ' editor-text-box-correct' : '')
                            }
                            onChange={this.getUpdateAnswerCallback(answer)}
                            maxLength="120" />
                    </InputGroup>
                </div>
            </Row>
        );
    }

    renderAnswerBoxes() {
        const answerBoxes = [];
        for (let index = 0; index < MAX_ANSWERS; index++) {
            answerBoxes.push(this.answerBox(index));
        }
        return answerBoxes;
    }

    renderImageSection() {
        const { question } = this.props;
        return (
            <Row className="image-section">
                <div className="image-controls">
                    <InputGroup style={{ gap: "0" }}>
                        <Button variant="secondary" as="label" htmlFor="image-upload">
                            <img src={ImageIcon} className="material-ui-icon" alt="Add an image" />
                            <span> {question.imageUrl ? "Select another image" : "Add image (optional)"}</span>
                        </Button>
                        {question.imageUrl && <Button variant="danger" onClick={this.removeImage}>
                            <img src={DeleteForever} className="material-ui-icon" alt="Remove image" />
                            <span> Remove image</span>
                        </Button>}

                    </InputGroup>
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={this.onImageChange}
                        style={{ display: 'none' }}
                    />
                </div>
                {question.imageUrl && (
                    <div className="image-preview">
                        <div className="image-preview-frame">
                            <img src={question.imageUrl} alt="Question" />
                        </div>
                    </div>
                )}
                {question.imageUrl && (
                    <div className="aspect-ratio-indicator-advice">
                        The recommended image size is 1215 x 355 pixels. This aspect ratio (as indicated by the red
                        frame) works well on 16:9 screens with the browser in full-screen mode. As a rule of thumb,
                        wider images (even wider than 1215:355) work better across different screen sizes.
                    </div>
                )}
            </Row>
        );
    }

    renderQuestionTypeToggle() {
        const questionType = this.props.question.type || "multiple-choice";
        return (
            <Row style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold" }}>Question Type:</span>
                    <Button
                        variant={questionType === "multiple-choice" ? "primary" : "outline-secondary"}
                        onClick={() => this.toggleQuestionType("multiple-choice")}
                        size="sm"
                    >
                        Multiple Choice
                    </Button>
                    <Button
                        variant={questionType === "text-entry" ? "primary" : "outline-secondary"}
                        onClick={() => this.toggleQuestionType("text-entry")}
                        size="sm"
                    >
                        Text Entry
                    </Button>
                </div>
            </Row>
        );
    }

    renderReferenceAnswers() {
        const referenceAnswers = this.props.question.referenceAnswers || [];
        return (
            <Row>
                <div className="reference-answers-section">
                    <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                        Reference Answers (optional, for host's reference):
                    </div>
                    {referenceAnswers.map((answer, index) => (
                        <InputGroup key={index} style={{ marginBottom: "0.5rem" }}>
                            <Form.Control
                                type="text"
                                value={answer}
                                onChange={(e) => this.updateReferenceAnswer(index, e.target.value)}
                                placeholder={`Reference answer ${index + 1}`}
                                maxLength="120"
                            />
                            <Button
                                variant="danger"
                                onClick={() => this.removeReferenceAnswer(index)}
                            >
                                <img src={DeleteForever} className="material-ui-icon" alt="Remove" />
                            </Button>
                        </InputGroup>
                    ))}
                    <Button
                        variant="secondary"
                        onClick={this.addReferenceAnswer}
                        size="sm"
                    >
                        + Add Reference Answer
                    </Button>
                </div>
            </Row>
        );
    }

    render() {
        if (this.props.question) {
            const questionType = this.props.question.type || "multiple-choice";
            return (
                <Container fluid className="question-editor-container">
                    {this.renderQuestionTypeToggle()}
                    <Row>
                        <Form.Control
                            as="textarea"
                            value={this.props.question.question}
                            className="editor-textarea"
                            onChange={this.onQuestionTextChange}
                            placeholder="Question"
                            maxLength="200"
                        />
                    </Row>
                    {this.renderImageSection()}
                    {questionType === "multiple-choice" ? this.renderAnswerBoxes() : this.renderReferenceAnswers()}
                </Container>
            );
        } else {
            return (
                <div style={{ margin: '40px auto 0 0', textAlign: "left", fontSize: "1.2rem" }}>
                    <p>Use this editor to create or modify a quiz:</p>
                    <ul>
                        <li>Upload a quiz (if you have one)</li>
                        <li>Use the buttons above to add/order/remove questions</li>
                        <li>Switch between questions on the left-hand side</li>
                        <li><span style={{ color: "red" }} >Download the quiz when finished</span></li>
                    </ul>
                    <div style={{ marginTop: "1.25em" }}>
                        <Button variant="warning"
                            onClick={this.props.loadSampleQuiz}>
                            Create sample questions
                        </Button>
                    </div>
                </div >
            );
        }
    }
}

export default QuestionEditor;
