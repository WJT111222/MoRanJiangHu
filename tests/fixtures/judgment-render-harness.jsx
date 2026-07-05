import React from 'react';
import { createRoot } from 'react-dom/client';
import TurnItem from '../../components/features/Chat/TurnItem';

const response = {
    logs: [
        { sender: '旁白', text: '王管事脸色发白。' },
        {
            sender: '[洞察]',
            text: '[洞察]查阅账目漏洞｜判定角色 玩家:杨培强｜判定值 11/难度 8｜基础 B(+6,观察与逻辑分析)｜状态 S(+3,过目不忘天赋加成)｜结果=成功 杨培强翻开账册，一目十行。'
        },
        {
            sender: '[洞察]',
            text: '[洞察]观察晨雾与山路状况｜成功｜触发对象 玩家:杨培强｜判定值 7/难度 5｜基础 B(+5,过目不忘的观察力)｜环境 E(+2,晨光渐亮)｜状态 S(0,无负面状态)｜幸运 L'
        }
    ],
    shortTerm: '杨培强查账成功。',
    judge_blocks: [
        {
            key: 'judge-1',
            text: [
                '判定值拆解',
                '基础：+6（观察与逻辑分析）',
                '状态：+3（过目不忘天赋加成）',
                '难度拆解',
                '基础：8（账目遮掩）',
                '结果：成功'
            ].join('\n')
        }
    ],
    body_optimized: false
};

createRoot(document.getElementById('root')).render(
    <TurnItem
        response={response}
        turnNumber={1}
        rawJson=""
        onSaveEdit={() => null}
        collapseThinkingStream
    />
);

document.body.dataset.e2eReady = 'true';
