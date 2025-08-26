// 初始化sse响应
function initSSE(res) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8'); // 事件流格式
    res.setHeader('Cache-Control', 'no-cache'); // 不缓存
    res.setHeader('Connection', 'keep-alive');  // 保持连接
    res.flushHeaders(); // 刷新响应头
}
// 发送sse事件
function sendSSE(res,event,data){
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// 关闭sse连接
function closeSSE(res){
    res.end();
}

// 发送错误事件
function sendError(res,error){
    sendSSE(res,'error',{message:error.message});
}

export{
    initSSE,
    sendSSE,
    closeSSE,
    sendError
}
