import { parentPort,workerData } from 'worker_threads';
import fs from 'fs'

const writeFile = () => {
    console.log('workerData.obj',workerData.obj)
    const full_path = `${workerData.fileName}`;
    return fs.writeFile(full_path, JSON.stringify(workerData.obj), (err) => {
        if (err)
            throw err
        else {
            return true

        }
    });
}

parentPort.postMessage(writeFile())

