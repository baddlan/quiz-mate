import { Component } from "react";
import CenterBox from "../../components/CenterBox";

import CheckCircleOutline from "../../assets/icons/check_circle_outline.svg";
import InsertEmoticon from "../../assets/icons/insert_emoticon.svg";
import PauseCircleOutline from "../../assets/icons/pause_circle_outline.svg";
import SentimentVeryDissatisfied from "../../assets/icons/sentiment_very_dissatisfied.svg";

import "../../assets/icons/material-ui-icon.css";

class Waiting extends Component {
    render() {
        const questionType = this.props.question?.type || "multiple-choice";

        if (questionType === "text-entry" && this.props.textAnswer) {
            const playerAnswers = this.props.playerAnswers || [];
            const myAnswer = playerAnswers.find(a => a.nickname === this.props.game.playerName);
            const wasMarkedCorrect = myAnswer?.markedCorrect || false;
            const referenceAnswers = this.props.question?.referenceAnswers || [];

            if (playerAnswers.length > 0) {
                if (wasMarkedCorrect) {
                    return (
                        <CenterBox logo cancel="Exit" {...this.props}>
                            <img
                                src={InsertEmoticon}
                                className="material-ui-icon"
                                style={{ fontSize: "4.0em" }}
                                alt="Correct answer"
                            />
                            <div className="message-box">
                                <p>Your answer was correct!</p>
                                <p>Congratulations!</p>
                            </div>
                        </CenterBox>
                    );
                } else {
                    return (
                        <CenterBox logo cancel="Exit" {...this.props}>
                            <img
                                src={SentimentVeryDissatisfied}
                                className="material-ui-icon"
                                style={{ fontSize: "4.0em" }}
                                alt="Not selected"
                            />
                            <div className="message-box">
                                <p>Your answer was not selected.</p>
                                {referenceAnswers.length > 0 && (
                                    <>
                                        <p>Accepted answers:</p>
                                        <p>{referenceAnswers.join(", ")}</p>
                                    </>
                                )}
                            </div>
                        </CenterBox>
                    );
                }
            } else {
                return (
                    <CenterBox logo cancel="Exit" {...this.props}>
                        <img
                            src={PauseCircleOutline}
                            className="material-ui-icon"
                            style={{ fontSize: "4.0em" }}
                            alt="Waiting"
                        />
                        <div className="message-box">
                            <p>You submitted</p>
                            <p>"{this.props.textAnswer}"</p>
                            <br />
                            <p>Waiting for the host to<br />review answers...</p>
                        </div>
                    </CenterBox>
                );
            }
        }

        if (this.props.selectedAnswer != null) {
            if (this.props.correctAnswer != null) {
                if (this.props.selectedAnswer === this.props.correctAnswer) {
                    return (
                        <CenterBox logo cancel="Exit" {...this.props}>
                            <img
                                src={InsertEmoticon}
                                className="material-ui-icon"
                                style={{ fontSize: "4.0em" }}
                                alt="Correct answer"
                            />
                            <div className="message-box">
                                <p>You are right.</p>
                                <p>Congratulations!</p>
                            </div>
                        </CenterBox>
                    );
                } else {
                    return (
                        <CenterBox logo cancel="Exit" {...this.props}>
                            <img
                                src={SentimentVeryDissatisfied}
                                className="material-ui-icon"
                                style={{ fontSize: "4.0em" }}
                                alt="Wrong answer"
                            />
                            <div className="message-box">
                                <p>No points this time around.</p>
                                <p>The right answer is:</p>
                                <p>{this.props.question.answers[this.props.question.correct]}</p>
                            </div>
                        </CenterBox>
                    );
                }
            } else {
                return (
                    <CenterBox logo cancel="Exit" {...this.props}>
                        <img
                            src={PauseCircleOutline}
                            className="material-ui-icon"
                            style={{ fontSize: "4.0em" }}
                            alt="Waiting"
                        />
                        <div className="message-box">
                            <p>You have selected</p>
                            <p>"{this.props.question.answers[this.props.selectedAnswer]}"</p>
                            <br />
                            <p>Waiting for the host to<br />reveal the right answer...</p>
                        </div>
                    </CenterBox>
                );
            }
        } else {
            const joinMessage = this.props.game.hostingRoom.title
                ? (
                    <div>
                        <p>You have joined</p>
                        <p>"{this.props.game.hostingRoom.title.trim()}"</p>
                    </div>
                )
                : (
                    <p>You have joined the quiz.</p>
                );
            return (
                <CenterBox logo cancel="Exit" {...this.props}>
                    <img
                        src={CheckCircleOutline}
                        className="material-ui-icon"
                        style={{ fontSize: "4.0em" }}
                        alt="Waiting"
                    />
                    <div className="message-box">
                        {joinMessage}
                        <p>Waiting for the next question...</p>
                    </div>
                </CenterBox>
            );
        }
    }
}

export default Waiting;
