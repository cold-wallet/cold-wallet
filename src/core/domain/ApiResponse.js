export default class ApiResponse {

    success
    result
    error
    code

    static success({code, result}) {
        let apiResponse = new ApiResponse();
        apiResponse.success = true;
        apiResponse.code = code;
        apiResponse.result = result;
        return apiResponse;
    }

    static fail({code, error}) {
        let apiResponse = new ApiResponse();
        apiResponse.success = false;
        apiResponse.code = code;
        apiResponse.error = error;
        return apiResponse;
    }
}
