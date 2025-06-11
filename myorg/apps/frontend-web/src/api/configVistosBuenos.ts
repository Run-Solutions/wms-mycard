import API from "./http"

export const getConfigVistosBuenos = async () => {
    try {
        const response = await API.get('/work-order-cqm/form-questions')
        if (response.status === 200) {
            return response.data
        }          
        throw new Error('Error al obtener las preguntas')
    } catch (error) {
        throw error
    }
}

export const getFormQuestionsByArea = async (id: number) => {
    try {
        const response = await API.get(`/work-order-cqm/${id}/form-questions`)
        if (response.status === 200) {
            return response.data
        }          
        throw new Error('Error al obtener las preguntas')
    } catch (error) {
        throw error
    }
}

export const deleteFormQuestion = async (id: number) => {
    try {
        const response = await API.delete(`/work-order-cqm/${id}/delete`)
        if (response.status === 200) {
            return response.data
        }          
        throw new Error('Error al eliminar la pregunta')
    } catch (error) {
        throw error
    }
}

export const updateFormQuestion = async (id: number, title: string) => {
    try {
        const response = await API.patch(`/work-order-cqm/${id}/new-question`, {
            title: title
        })
        if (response.status === 200) {
            return response.data
        }          
        throw new Error('Error al actualizar la pregunta')
    } catch (error) {
        throw error
    }
}