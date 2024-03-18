import { parentPort,workerData } from 'worker_threads';
import fs from 'fs'
const readFile = (obj)=>{
    const full_path = `caching/${workerData.fileName}`;
    let json =  fs.readFileSync(full_path, "utf8")
    // return json
    parentPort.postMessage(json)
}
readFile()




