import React, { useEffect, useState, useRef } from 'react';
import { Store } from 'react-notifications-component';
import {
    FaCog,
    FaVideo,
    FaDesktop,
    FaVideoSlash,
    FaMicrophone,
    FaMicrophoneSlash,
} from 'react-icons/fa';
import {
    BsXLg,
    // BsRecordCircle,
    BsFillChatRightDotsFill,
    BsFillFileEarmarkCheckFill
} from 'react-icons/bs';
import { BiSend } from 'react-icons/bi';
import { ImAttachment } from 'react-icons/im';

import h from '../../lib/helpers.js';
import Utills from '../../lib/utills.js';

import { IPc, IActive, IMessage } from '../../type';

import { ChatElement } from '../ChatElement';

import './index.scss';


type toggleFunction = (type: string) => void;
type onSettingFunction = (index: number, type: string) => void;
type disconnectFunction = (id: string) => void;

interface IProps {
    onToggle: toggleFunction;
    disconnect: disconnectFunction;
    onSetting: onSettingFunction;
    host: IPc;
    partner?: IPc;
    socket: any;
}

const Navbar = (props: IProps) => {
    const [chatText, setChatText] = useState<string>('');
    const [time, setTime] = useState(0);
    const [fileName, setFileName] = useState<string>('');
    const [chatList, setChatList] = useState<IMessage[]>([]);
    const [videoList, setVideoList] = useState<any[]>([]);
    const [inputAudioList, setInputAudioList] = useState<any[]>([]);
    const [activeButton, setActiveButton] = useState<IActive>(
        {
            exit: false,
            setting: false,
            chat: false,
            audio: true,
            video: true
        });

    const fileRef = useRef<HTMLInputElement>(null);
    const chatRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileDisplayRef = useRef<HTMLDivElement>(null);

    const room = window.location.hash.split('#')[1];

    const changeActive = (key: string) => {
        const active = { ...activeButton }
        active[key] = !active[key];
        if (key === 'audio' || key === 'video') {
            props.onToggle(key);
        }
        setActiveButton(active);
    }

    const screenSharing = () => {
        h.screenSharing();
    }

    const recording = () => {

    }

    const getDevices = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();

        const _videoList = devices.filter(device => device.kind === 'videoinput');
        const _audioInputList = devices.filter(device => device.kind === 'audioinput');
        const _audioOutputList = devices.filter(device => device.kind === 'audiooutput');

        setVideoList(_videoList);
        setInputAudioList(_audioInputList);
    }

    const selectOption = (type: string, e: any) => {
        props.onSetting(e.target.value, type);
    }

    const changeText = (e: any) => {
        const text = e.target.value;

        if (text.length > 25 || text.split('\n').length >= 2) {
            if (chatRef.current)
                chatRef.current.style.height = '2.7em';
        }

        if (text.length < 25 && text.split('\n').length < 2) {
            if (chatRef.current)
                chatRef.current.style.height = '1.5em';
        }

        setChatText(text)
    }

    const sendMessage = async () => {
        if (fileName !== '') {
            if (fileRef.current && fileRef.current.files) {
                const uploadedName = new Date().valueOf().toString();

                const data = {
                    time: new Date(),
                    isFile: true,
                    content: fileName,
                    user_id: props.host.clientId,
                    userName: props.host.username,
                    uploadedName: uploadedName,
                }

                if (props.partner?.clientId) {
                    let formData = new FormData();

                    formData.append('name', uploadedName);
                    formData.append('file', fileRef.current.files[0]);

                    const res = await fetch('/upload', {
                        method: 'POST',
                        body: formData
                    })

                    const result = await res.json();
                    // console.log('file upload = ', result);

                    if (result.state) {
                        props.socket.emit('sendChat', {
                            content: data,
                            to: props.partner?.clientId
                        });

                        setChatList([...chatList, data]);
                    } else {
                        Store.addNotification({
                            title: "Failed!",
                            message: `File transfer is failed`,
                            type: "danger",
                            insert: "top",
                            container: "top-right",
                            animationIn: ["animate__animated", "animate__fadeIn"],
                            animationOut: ["animate__animated", "animate__fadeOut"],
                            dismiss: {
                                duration: 2000,
                                onScreen: true
                            }
                        });
                    }
                    removeFile();
                }
            }
        }
        else {
            if (chatText) {
                const data = {
                    time: new Date(),
                    content: chatText,
                    user_id: props.host.clientId,
                    userName: props.host.username,
                    isFile: false,
                }

                if (props.partner?.clientId) {
                    props.socket.emit('sendChat', {
                        content: data,
                        to: props.partner?.clientId
                    });
                }

                setChatList([...chatList, data]);
                setChatText('');
            }
            chatRef.current?.focus();
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        })
    }

    const uploadFile = () => {
        if (fileRef.current && fileRef.current.files) {
            if (fileRef.current.files[0].size > 104856700) {
                alert("File is too big!");
                fileRef.current.value = '';
                return;
            }
            setFileName(fileRef.current.files[0].name);

            if (chatRef.current)
                chatRef.current.style.display = 'none';
            if (fileDisplayRef.current)
                fileDisplayRef.current.style.display = 'flex';
        }
    }

    const removeFile = () => {
        setFileName('');
        if (fileRef.current)
            fileRef.current.value = '';

        if (chatRef.current)
            chatRef.current.style.display = 'block';
        if (fileDisplayRef.current)
            fileDisplayRef.current.style.display = 'none';
    }

    useEffect(() => {
        getDevices();

        // chatRef.current?.addEventListener('dragover', (event) => {
        //     if (chatRef.current)
        //         chatRef.current.style.border = '1px solid white';
        // })

        // chatRef.current?.addEventListener('dragleave', (event) => {
        //     if (chatRef.current)
        //         chatRef.current.style.border = 'none';
        // })

        // return () => {
        //     chatRef.current?.removeEventListener('dragover', () => { });
        //     chatRef.current?.removeEventListener('dragleave', () => { });
        // }

        const timeInterval = setInterval(() => {
            setTime(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(timeInterval);
        }
    }, []);

    useEffect(() => {
        setTimeout(() => {
            scrollToBottom()
        }, 100);

        props.socket.on('receiveChat', (data: any) => {
            setChatList([...chatList, data.data]);
        })

        return () => {
            props.socket.off('receiveChat');
        }
    }, [chatList])
    return (
        <>
            <nav>
                <img src='image/logo.png' alt="logo" />
                <div>
                    <div className="x-code">
                        <div>
                            <img src={Utills.urlString(props.host.image)} alt="user" />
                            <span className='spot-name'>{props.host.username} session</span>
                        </div>
                        <p>{Utills.convertTrackingTime(time)}</p>
                    </div>
                    <div className="x-btn x-controller">
                        <span onClick={() => changeActive('chat')}><BsFillChatRightDotsFill /></span>
                        <span onClick={screenSharing} ><FaDesktop /></span>
                        <span onClick={() => changeActive('audio')}>{activeButton.audio ? <FaMicrophone /> : <FaMicrophoneSlash />}</span>
                        <span onClick={() => changeActive('video')}>{activeButton.video ? <FaVideo /> : <FaVideoSlash />}</span>
                        <span onClick={() => changeActive('setting')}><FaCog /></span>
                        {/* <span onClick={recording}><BsRecordCircle /></span> */}
                        <button className='active exit-btn' onClick={() => changeActive('exit')}>Exit Session</button>
                    </div>
                </div>
            </nav>
            <div className={`modal left ${activeButton.chat ? "show" : ''}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <span onClick={() => { changeActive('chat') }}><BsXLg /></span>
                    </div>
                    <div className="modal-body">
                        <div>
                            {
                                chatList.map((ele, index) => (
                                    <ChatElement key={index} {...{ data: ele, myId: props.host.clientId }} />
                                ))
                            }
                        </div>
                        <div ref={messagesEndRef}></div>
                    </div>
                    <div className='modal-footer'>
                        <textarea
                            className='chat-box'
                            placeholder='Type a message'
                            ref={chatRef}
                            value={chatText}
                            onChange={(e) => changeText(e)}
                        />
                        <div ref={fileDisplayRef} className="file-element" ><BsFillFileEarmarkCheckFill />&nbsp;{Utills.recudeFileName(fileName)}
                            <span onClick={removeFile}><BsXLg /></span>
                        </div>
                        <span className='chat-send-btn' onClick={() => sendMessage()}><BiSend /></span>
                        <span onClick={() => { fileRef.current?.click(); }}><ImAttachment /></span>
                        <input type='file' ref={fileRef} onChange={() => uploadFile()} />
                    </div>
                </div>
            </div>
            <div className={`modal center ${activeButton.exit ? "show" : ''}`}>
                <div className="modal-content">
                    <div className="modal-footer">
                        <h1>Do you want to exit this session?</h1>
                        <div className='btn-group'>
                            <button className='active' onClick={() => window.location.href = 'https://kunnec.com/public/k_screen/recording/record_details'}>Yes</button>
                            <button onClick={() => changeActive('exit')}>No</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`modal right ${activeButton.setting ? "show" : ''}`}>
                <div className='overlay' onClick={() => changeActive('setting')}></div>
                <div className="modal-content">
                    <div className="modal-body">
                        <h1>Settings</h1>
                        <p>Camera</p>
                        <select onChange={(e) => selectOption('video', e)}>
                            {
                                videoList.map((ele) => (
                                    <option key={ele.deviceId} value={ele.deviceId} >{ele.label}</option>
                                ))
                            }
                        </select>
                        <p>Microphone</p>
                        <select onChange={(e) => selectOption('audioInput', e)}>
                            {
                                inputAudioList.map((ele) => (
                                    <option key={ele.deviceId} value={ele.deviceId}>{ele.label}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => { changeActive('setting') }}>Close</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
