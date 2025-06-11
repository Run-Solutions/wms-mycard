import API from "./http"

export const getWorkOrders = async () => {
    const estados = ['Listo', 'Cerrado'];
    const query = estados.map(estado => encodeURIComponent(estado)).join(',');
    try {
        const response = await API.get('/work-orders/in-progress?statuses=' + query)
        if (response.status === 200) {
            return response.data
        }
        throw new Error('Error al obtener las preguntas')
    } catch (error) {
        throw error
    }
}

export const getFileByName = async (filename: string) => {
    try {
        const response = await API.get(`free-order-flow/file/${filename}`, {responseType: 'arraybuffer'})
        if (response.status === 200) {
            return response.data
        }
        throw new Error('Error al obtener el archivo')
    } catch (error) {
        throw error
    }
}