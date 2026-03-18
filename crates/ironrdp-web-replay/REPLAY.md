# Replay Engine Design
I want this file to be treated as a design ideation document for the rust crate that does session replay. This follows the structure defined in this document - https://wiki.cfdata.org/spaces/~kkashyap/pages/1365395087/RDP+Session+Replay+Player. 

## Buffer
Contains the queue DS definition that holds the queue of PDUs, which will be used for replay

## Replay
The struct that is exposed for all things related to processing PDUs

### State it will hold
- PDU buffer
- Render Function that takes in a timestamp value
- Struct must a wasmbindgen
- I've already created the base Replay struct. Can you check if that is correct and correct it if needed. 
