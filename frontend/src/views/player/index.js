import { Component } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import socketIOClient from "socket.io-client";
import { setHostingRoomAC, switchStateAC } from "../../actions/game";
import {
    addToRoom,
    answersClose,
    answersOpen,
    gameCompleted,
    joinedToRoom,
    nicknameIsTaken,
    roomNotFound,
    server,
    textAnswerSubmitted,
    textAnswersResults,
    timerSync
} from "../../connection/config";
import { disableReconnectMode, enableReconnectMode } from "../../connection/reconnect";
import { onPlayerJoinGame } from "../../utilities";
import { MAX_WEB_SOCKET_MESSAGE_SIZE } from "../../utilities/constants";
import Final from "./Final";
import LoadingRoom from "./LoadingRoom";
import NicknameIsTaken from "./NicknameIsTaken";
import Question from "./Question";
import RoomNotFound from "./RoomNotFound";
import { V_FINAL, V_LOADING_ROOM, V_NICKNAME_IS_TAKEN, V_QUESTION, V_ROOM_NOT_FOUND, V_WAITING } from "./views";
import Waiting from "./Waiting";

class Player extends Component {

    constructor(props) {
        super(props);
        this.state = {
            question: null,
            selectedAnswer: null,
            correctAnswer: null,
            timerValue: 0,
            textAnswer: "",
            playerAnswers: []
        };
        this.selected = this.selected.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
        this.submitTextAnswer = this.submitTextAnswer.bind(this);
    }

    onTextChange(e) {
        this.setState({ textAnswer: e.target.value });
    }

    submitTextAnswer() {
        const answer = this.state.textAnswer.trim();
        if (answer && this.props.game.roomCode && this.props.game.playerName) {
            this.socket.emit(
                textAnswerSubmitted,
                this.props.game.roomCode,
                this.props.game.playerName,
                answer
            );
            this.props.switchState(V_WAITING);
        }
    }

    componentDidMount() {
        this.props.switchState(V_LOADING_ROOM);
        if (this.props.game.roomCode && this.props.game.playerName) {
            this.socket = socketIOClient(server, {
                closeOnBeforeunload: false,
                maxHttpBufferSize: MAX_WEB_SOCKET_MESSAGE_SIZE
            });

            this.socket.on('connect', () => this.socket.emit(
                addToRoom, this.props.game.roomCode, this.props.game.playerName, this.props.game.reconnectMode
            ));

            this.socket.on(nicknameIsTaken, () => {
                this.props.switchState(V_NICKNAME_IS_TAKEN);
                disableReconnectMode();
            });

            this.socket.on(roomNotFound, () => {
                this.props.switchState(V_ROOM_NOT_FOUND);
                disableReconnectMode();
            });

            this.socket.on(joinedToRoom, roomObject => {
                onPlayerJoinGame(roomObject.title);
                this.props.setHostingRoom(roomObject);
                this.props.switchState(V_WAITING);
                enableReconnectMode(this.props.game.roomCode, this.props.game.playerName);
            });

            this.socket.on(answersOpen, question => {
                this.setState({
                    question: question,
                    selectedAnswer: null,
                    correctAnswer: null,
                    timerValue: this.props.game.hostingRoom.timeLimit,
                    textAnswer: "",
                    playerAnswers: []
                });
                this.props.switchState(V_QUESTION);
            });

            this.socket.on(answersClose, question => {
                this.setState({
                    question: question,
                    correctAnswer: question.correct
                });
                this.props.switchState(V_WAITING);
            });

            this.socket.on(textAnswersResults, playerAnswers => {
                this.setState({
                    playerAnswers: playerAnswers || []
                });
            });

            this.socket.on(timerSync, value => this.setState({ timerValue: value }));

            this.socket.on(gameCompleted, stats => {
                this.setState({ stats: stats });
                this.props.switchState(V_FINAL);
                disableReconnectMode();
            });

        } else {
            this.props.navigate('/');
        }
    }

    componentWillUnmount() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    selected(selectedAnswer) {
        this.setState({ selectedAnswer });
    };

    render() {
        switch (this.props.game.state) {
            case V_LOADING_ROOM:
                return (<LoadingRoom {...this.props} />);
            case V_NICKNAME_IS_TAKEN:
                return (<NicknameIsTaken {...this.props} />);
            case V_ROOM_NOT_FOUND:
                return (<RoomNotFound {...this.props} />);
            case V_WAITING:
                return (
                    <Waiting {...this.props}
                        question={this.state.question}
                        selectedAnswer={this.state.selectedAnswer}
                        correctAnswer={this.state.correctAnswer}
                        textAnswer={this.state.textAnswer}
                        playerAnswers={this.state.playerAnswers}
                    />
                );
            case V_QUESTION:
                return (
                    <Question {...this.props}
                        socket={this.socket}
                        question={this.state.question}
                        selected={this.selected}
                        timer={this.state.timerValue}
                        textAnswer={this.state.textAnswer}
                        onTextChange={this.onTextChange}
                        submitTextAnswer={this.submitTextAnswer}
                    />
                );
            case V_FINAL:
                return (<Final {...this.props} stats={this.state.stats} />);
            default:
                return (<span>NOT FOUND</span>);
        }
    }
}

const mapStateToProps = state => {
    return {
        game: state.game
    };
};

const mapDispatchToProps = dispatch => ({
    switchState: (...args) => dispatch(switchStateAC(...args)),
    setHostingRoom: (...args) => dispatch(setHostingRoomAC(...args))
});

const ConnectedPlayer = connect(mapStateToProps, mapDispatchToProps)(Player);

const ConnectedPlayerWithNavigate = props => (<ConnectedPlayer {...props} navigate={useNavigate()} />);

export default ConnectedPlayerWithNavigate;
