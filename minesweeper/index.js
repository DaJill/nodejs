var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var iX = 16;
var iY = 16;
var iBomb = 40;
var iGameTime = 0;
var GameTimeObj;
var FirstIn = true;

var aBom = getMap(iX, iY, iBomb);
aBom = createNumber(aBom);
// aBom = [[0,0,0],[2,3,2],[-1,-1,-1]];
var aClick = initClick(iX, iY);

var PlayerList = {};
//遊戲資訊物件
var GameInfo = {
    PlayerInfo: {
        1: null,
        2: null,
        3: null,
        4: null
    },

    Caculator: {
        1: 0,
        2: 0,
        3: 0,
        4: 0
    },

    Map: null,
    GameStatus:{
        Owner: "",
        Result: 0
    }
};



app.get('/', function (req, res) {
    req = req || null;
    res.sendfile('index.html');
});

io.on('connection', function (socket) {
    socket.on('map message', function (iX, iY) {
        if (iX !== -1) {
            aClick[iX][iY] = 1;
        }
        io.emit('map message', aBom, aClick);
    });

    //第一次進入
    socket.on('map init', function (user_name) {

        var UserID = socket.id;
        GameInfo.PlayerInfo = addPlayerInfo(GameInfo, UserID,user_name);
        if (GameInfo.Map === null){
            GameInfo.Map = initMap(iX,iY);
        }
        GameInfo.Caculator = getCaculatorInfo(GameInfo.Map);
        var iAmPlay = PlayerList[UserID];
        io.emit('map init', GameInfo, iAmPlay);
        // io.sockets.socket(UserID).emit('map init', GameInfo, iAmPlay);
    });

    //點擊的動作
    socket.on('action game', function (iX, iY, iState) {
        var UserID = socket.id;
        var iOwner = PlayerList[UserID];

        if(FirstIn){
            timedCount();
            FirstIn = false;
        }
        switch (iState){
            case 1:
                GameInfo = openMap(iX, iY, iOwner, aBom, GameInfo);
                break;
            case 2:
                GameInfo = setFlag(iX, iY, iOwner, aBom, GameInfo);
                break;
        }

        GameInfo.Caculator = getCaculatorInfo(GameInfo.Map);
        GameInfo.GameStatus.Result = checkWin(aBom, GameInfo, iState);
        if(GameInfo.GameStatus.Result != 0){
            clearTimeout(GameTimeObj);
            iGameTime = 0;
        }
        io.emit('action game', GameInfo);
    });

    //restart
    socket.on('restart', function () {
        gameInit();
        io.emit('restart', GameInfo);
    });

    // socket.on('map Timer', function () {


    // });

    socket.on('disconnect', function () {
        var UserID = socket.id;
        GameInfo.PlayerInfo = delPlayerInfo(GameInfo, UserID);
        io.emit('action game', GameInfo);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

function timedCount(){
    iGameTime++;
    GameTimeObj = setTimeout(timedCount,1000);
    io.emit('map Timer', iGameTime);
}

function getMap(_iXAxis, _iYAxis, _iBoomNum) {
    var aMap = [];
    var aRandMap = [];
    var size = _iXAxis * _iYAxis;
    var i, j, iPos;
    for (i = 0; i < _iBoomNum; i++) {
        aRandMap[i] = -1;
    }
    for (i = _iBoomNum; i < size; i++) {
        aRandMap[i] = 0;
    }
    aRandMap = shuffle(aRandMap);
    for (i = 0; i < _iYAxis; i++) {
        aMap[i] = [];
        for (j = 0; j < _iXAxis; j++) {
            iPos = i * _iXAxis + j;
            aMap[i][j] = aRandMap[iPos];
        }
    }

    return aMap;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }

    return a;
}

function checkBombNum($_iXPos, $_iYPos, $_aMap) {
    var $iBombNum = 0;
    var $aCheckPos = [];
    var $iXMax = $_aMap[0].length;
    var $iYMax = $_aMap.length;
    $aCheckPos[0] = [-1, -1];
    $aCheckPos[1] = [-1, 0];
    $aCheckPos[2] = [-1, 1];
    $aCheckPos[3] = [ 0, -1];
    $aCheckPos[4] = [ 0, 1];
    $aCheckPos[5] = [ 1, -1];
    $aCheckPos[6] = [ 1, 0];
    $aCheckPos[7] = [ 1, 1];
    var $iIndex, $aPos, $iCheckY, $iCheckX, $iXPos, $iYPos;
    for ($iIndex in $aCheckPos) {
        $aPos = $aCheckPos[$iIndex];
        $iCheckY = $aPos[0];
        $iCheckX = $aPos[1];

        $iXPos = parseInt($iCheckX) + parseInt($_iXPos);
        $iYPos = parseInt($iCheckY) + parseInt($_iYPos);

        if ($iXPos < 0 || $iYPos < 0) {
            continue;
        }

        if ($iXPos >= $iXMax || $iYPos >= $iYMax) {
            continue;
        }
        if ($_aMap[$iYPos][$iXPos] === -1) {
            $iBombNum++;
        }
    }

    return $iBombNum;
}

function createNumber($_aMap) {
    var $iYPos, $iXPos, $aX, $iVal;
    for ($iYPos in $_aMap) {
        $aX = $_aMap[$iYPos];
        for ($iXPos in $aX) {
            $iVal = $aX[$iXPos];
            if ($iVal !== -1) {
                $_aMap[$iYPos][$iXPos] = checkBombNum($iXPos, $iYPos, $_aMap);
            }
        }
    }
    return $_aMap;
}

function initClick(_XLen, _YLen) {
    var aClick = [];
    var i, j;
    for (i = 0; i < _YLen; i++) {
        aClick[i] = [];
        for (j = 0; j < _XLen; j++) {
            aClick[i][j] = 0;
        }
    }

    return aClick;
}

//空白地圖
function initMap(_iX,_iY){
    var BigMap = {};
    for(var y = 0;y < _iY; y++){
        var TmpBigMap = {};
        for(var x = 0;x < _iX; x++){
            TmpBigMap[x] = {
                state:0,
                value:0,
                owner:0
            };
        }
        BigMap[y] = TmpBigMap;
    }

    return BigMap;
}

function addPlayerInfo(_GameInfo, _id, _user_name){


    for(var i = 1 ; i <= 4; i++){
        if(_GameInfo.PlayerInfo[i] === null){
            _GameInfo.PlayerInfo[i] = _user_name;
            PlayerList[_id] = i;
            break;
        }
    }

    return _GameInfo.PlayerInfo;
}

function delPlayerInfo(_GameInfo, _id){
    var DelKey = PlayerList[_id];
    _GameInfo.PlayerInfo[DelKey] = null;

    return _GameInfo.PlayerInfo;
}

//計算玩家開的格子數量
function getCaculatorInfo(_MapInfo){

    var iYPos, iXPos;
    var aCountPlayer = {
        1:0,
        2:0,
        3:0,
        4:0
    };
    for (iYPos in _MapInfo) {
        for (iXPos in _MapInfo[iYPos]) {
            var iOwner = _MapInfo[iYPos][iXPos].owner;
            var iState = _MapInfo[iYPos][iXPos].state;

            if(iState === 1){
                aCountPlayer[iOwner]++;
            }
        }
    }

    return aCountPlayer;
}


//設定踩地雷的資訊並檢查GameOver
function openMap(_iX, _iY, _iOwner, _aBom, _GameInfo){
    //因不明原因X,Y會相反

    //第五個玩家要檔
    if(_iOwner === undefined){
        return _GameInfo;
    }
    //有插旗子的要檔
    if(_GameInfo.Map[_iY][_iX].state != 0){
        return _GameInfo;
    }

    var iMapUnit = _aBom[_iX][_iY];
    _GameInfo.Map[_iY][_iX].state = 1;
    _GameInfo.Map[_iY][_iX].value = iMapUnit;
    _GameInfo.Map[_iY][_iX].owner = _iOwner;

    if(iMapUnit === -1){
        _GameInfo.GameStatus.Result = 2;
        _GameInfo.GameStatus.Owner = _iOwner;
    }

    _GameInfo.Map = check0Open(_iX, _iY, _aBom, _GameInfo.Map, _iOwner);
    return _GameInfo;
}

function setFlag(_iX, _iY, _iOwner, _aBom, _GameInfo){

    if(_iOwner === undefined){
        return _GameInfo;
    }
    if(_GameInfo.Map[_iY][_iX].state == 0){
        _GameInfo.Map[_iY][_iX].state = 2;
        _GameInfo.Map[_iY][_iX].owner = _iOwner;
        return _GameInfo;
    }

    if(_iOwner == _GameInfo.Map[_iY][_iX].owner){
        _GameInfo.Map[_iY][_iX].state = 0;
        _GameInfo.Map[_iY][_iX].owner = 0;
    }
    return _GameInfo;
}

//檢查輸贏
function checkWin(_aBom, _GameInfo, _iState){

    for (iYPos in _GameInfo.Map) {
        for (iXPos in _GameInfo.Map[iYPos]) {
            if(_GameInfo.Map[iYPos][iXPos].state === 1 && _aBom[iXPos][iYPos] === -1){
                return _GameInfo.GameStatus.Result;
            }

            if(_GameInfo.Map[iYPos][iXPos].state === 0 && _aBom[iXPos][iYPos] !== -1){
                return _GameInfo.GameStatus.Result;
            }

            if(_GameInfo.Map[iYPos][iXPos].state === 2 && _aBom[iXPos][iYPos] !== -1){
                return _GameInfo.GameStatus.Result;
            }
        }
    }

    return 1;
}

//點空白展開地圖有問題
function check0Open(_iX, _iY, _aBom, _aMap, _iOwner ) {
    var aCheckPos = [];
    aCheckPos[0] = [-1,-1];
    aCheckPos[1] = [-1, 0];
    aCheckPos[2] = [-1, 1];
    aCheckPos[3] = [ 0,-1];
    aCheckPos[4] = [ 0, 1];
    aCheckPos[5] = [ 1,-1];
    aCheckPos[6] = [ 1, 0];
    aCheckPos[7] = [ 1, 1];

    if(_aBom[_iX][_iY] !== 0){
        return _aMap;
    }

    var iPosKey;
    for(iPosKey in aCheckPos){
        var aPosKey = aCheckPos[iPosKey];
        var iNewX = parseInt(_iX) + parseInt(aPosKey[0]);
        var iNewY = parseInt(_iY) + parseInt(aPosKey[1]);

        if(iNewX < 0 || iNewY < 0 || iNewX >= iX || iNewY >= iY ){
            continue;
        }

        if(_aMap[iNewY][iNewX].state !== 0){
            continue;
        }

        _aMap[iNewY][iNewX].state = 1;
        _aMap[iNewY][iNewX].value = _aBom[iNewX][iNewY];
        _aMap[iNewY][iNewX].owner = _iOwner;

        if(_aBom[iNewX][iNewY] == 0){
            check0Open(iNewX, iNewY, _aBom, _aMap, _iOwner);
        }

    }

    return _aMap;
}




function gameInit(){
    aBom = getMap(iX, iY, iBomb);
    aBom = createNumber(aBom);

    GameInfo.Caculator = {
        1: 0,
        2: 0,
        3: 0,
        4: 0
    }
    GameInfo.Map = initMap(iX,iY);
    GameInfo.GameStatus = {
        Owner: "",
        Result: 0
    }

    iGameTime = 0;
    FirstIn = true;
}