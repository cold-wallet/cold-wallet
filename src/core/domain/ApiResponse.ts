export default class ApiResponse<R> {
    constructor(
        public success: boolean,
        public result: R | any,
        public error: string | null,
        public code: number,
    ) {
    }

    static success<R>(code: number, result: R) {
        return new ApiResponse<R>(true, result, null, code);
    }

    static fail<R>(code: number, error: string) {
        return new ApiResponse<R>(false, null, error, code);
    }
}
