// api/api.ts
import axiosInstance from '@/config/axiosConfig';

// 调用后端 API，生成 token
export const generateToken = async (clientId: string, clientSecret: string): Promise<any> => {
    try {
        const response = await axiosInstance.post('/auth/token', {
            clientId:clientId,  // 传递 clientId
            clientSecret:clientSecret  // 传递 clientSecret
        });

        return response.data; // 返回后端响应的数据
    } catch (error: any) {
        throw new Error(`获取 token 失败: ${error.response?.data?.message || error.message}`);
    }
};

// 调用后端 API 进行专利搜索
export const searchPatents = async (patentJson: any): Promise<any> => {
    const apikey = sessionStorage.getItem('apikey');
    const token = sessionStorage.getItem('token');

    if (!apikey || !token) {
        throw new Error('apikey 或 token 缺失，请先输入信息获取token');
    }

    try {
        const response = await axiosInstance.post(`/patent/search/${apikey}/${token}`, patentJson);
        return response.data;  // 返回后端响应的数据
    } catch (error: any) {
        throw new Error(`专利搜索失败: ${error.response?.data?.message || error.message}`);
    }
};