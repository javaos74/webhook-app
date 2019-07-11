var express = require('express');
const Orchestrator = require('./orchestrator');
var router = express.Router();

var MY_TENANT_ID = 77469;
var MY_QUEUE = 'TestQueue';
var NOTI_PROC_NAME ='작업결과통보';
var NOTI_ROBOT_NAME ='총무로봇';

var jobs = new Set();
//사용할 orchestrator 정보 
var orch = new Orchestrator('koreatogether', 'admin', 'password', 'https://platform.uipath.com/koreatogether/koreatogether/')

/*
특정 Job이 schedule에 의해서 실행된 Job인 경우 해당 Job이 완료된 경우 담당자에게 알려주기 
*/
router.pos('/', function(req, res, next) {
    res.sendStatus(202);

    let type = req.body['Type']
    let tenant = req.body['TenantId']
    if( tenant == MY_TENANT_ID) { // 기대하는 Tenant 이고 
        // job이 만들어질때 Schedule인지 파악 
        if( type == 'job.created' && req.body['StartInfo']['Source'] != 'Manual' && req.body['StartInfo']['Source'] != 'Agent' ) {
            jobs.add( req.body['EventId'])
        }
        if( jobs.has( req.body['EventId']) && (type == 'job.faulted' || type == 'job.completed')) { // Job이 종료한 경우라면 
            var inputArgs = new Map();
            let procName= req.body['Release']['ProcessKey'];
            if( procName != NOTI_PROC_NAME) {
                let relKey = orch.getReleaseKey( NOTI_PROC_NAME); //작업 결과를 알려주는 프로세스 선택 
                let robotId = orch.getRobotId( NOTI_ROBOT_NAME); // 작업 결과를 알려주는 프로세스를 선택할 로봇 
                inputArgs.set( 'ContactEmail', req.body['Job']['OutputArguments']['ContactEmail']);
                inputArgs.set( 'ContactPhone', req.body['Job']['OutputArguments']['ContactPhone']);
                inputArgs.set( 'ProcessName', procName);
                let job = orch.startJob( { startInfo: {
                                        ReleaseKey : `${relKey}`,
                                        Strategy: 'Specific',
                                        RobotIds: [ parseInt(`${robotId}`)],
                                        Source: 'Manual',
                                        InputArguments: `${JSON.stringify(inputArgs)}`
                                    } });
            }
            jobs.delete( req.body['EventId']);
        }
    }
}


/* POST log webhook request . 
router.post('/', function(req, res, next) {
    console.log(req.body)
    res.sendStatus(202);

    let type = req.body['Type']
    let tenant = req.body['TenantId']
    if( tenant == MY_TENANT_ID) {
        if( type == 'queueItem.added' && req.body['Queue']['Name'] == MY_QUEUE) {
            //start new job hello world 
            let relKey = orch.getReleaseKey('사용자정보출력');
            let robotId = orch.getRobotId('개발로봇');
            console.log('startJob called');
            let job = orch.startJob( { startInfo: {
                                    ReleaseKey : `${relKey}`,
                                    Strategy: 'Specific',
                                    RobotIds: [ parseInt(`${robotId}`)],
                                    Source: 'Manual'
				                } });

	   console.log( job);
        }
    }
});
*/

module.exports = router;
