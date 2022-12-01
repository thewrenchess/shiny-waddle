const fs = require("fs")
const papa = require("papaparse")
const axios = require("axios")
const axiosThrottle = require("axios-request-throttle")

const PROD_PICKLIST_SVC = "https://wa-picksvc-prod-eastus.azurewebsites.net"
const DEFAULT_REQUEST_PER_SECOND = 5
const DEFAULT_SOURCE_ID_NAME = "sourceLocationId"
const DEFAULT_ORDER_ID_NAME = "orderId"

const args = process.argv.slice(2)
const boToken = args[0]
const filePath = args[1]
const sourceIdName = args.length > 2 ? args[2] : DEFAULT_SOURCE_ID_NAME
const orderIdName = args.length > 3 ? args[3] : DEFAULT_ORDER_ID_NAME

if (!filePath || !boToken) {
    console.log("missing file path or bo token")
    return
}

console.log('file', filePath)
console.log("source location id", sourceIdName)
console.log("order Id", orderIdName)
console.log("bo otken", boToken)

const axiosInstance = axios.create({
    baseURL: PROD_PICKLIST_SVC,
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer backoffice-${boToken}`
    }
})
axiosThrottle.use(axiosInstance, { requestsPerSecond: DEFAULT_REQUEST_PER_SECOND})

const file = fs.createReadStream(filePath)

papa.parse(file, {
    header: true,
    complete: (results, file) => {
        
        results.data.forEach((row, ind) => {

            const sourceId = row[sourceIdName]
            const orderId = row[orderIdName]

            if (!sourceId || !orderId) {
                console.log(`row ${ind} missing information`, row)
                return
            }

            getList(sourceId, orderId)
                .then(result => {
                    const data = result.data || {}

                    if (data.locationId != sourceId) {
                        console.log(`wrong or missing location id`, data.locationId)
                        return
                    }
                    if (!data.pickLists || !data.pickLists.length) {
                        console.log(`no order ${orderId} found at source location ${sourceId}`)
                        return
                    }

                    let picklist = result.data.pickLists.find(el => el.orderSourceId == orderId || el.oracleOrderId == orderId)
                    if (!picklist) {
                        console.log(`no order ${orderId} found at source location ${sourceId}`)
                        return
                    }

                    patchList(sourceId, picklist.id)
                        .then(result => console.log(`successfully patched order ${orderId} from source location ${sourceId}`))
                        .catch(err => {
                            console.log(`error when trying to cancel order ${orderId} from source location ${sourceId}`)
                            throw err
                        })
                })
                .catch(err => {
                    console.log(`error when trying to find picklist id for order ${orderId} from source location ${sourceId}`)
                    throw err
                })
        })
    },
    error: (error, file) => {
        console.log(error)
    }
})

async function getList(sourceId, orderId) {
    return axiosInstance.get('/pickLists', {
        params: {
            locationId: sourceId,
            orderId
        }
    })
}

async function patchList(sourceId, picklistId) {
    return axiosInstance.patch(
        `/pickLists/${picklistId}`,
        {
            listStatus: 'CANCELLED'
        },
        {
            headers: {
                locationId: sourceId,
                'Content-Type': 'application/json'
            }
        }
    )
}
