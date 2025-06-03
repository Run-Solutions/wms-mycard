import API from "./http"

type UpdateUserDto = {
  username: string;
  email: string;
  phone?: string;
  role?: string
};

export const getUsers = async () => {
  try {
    const response = await API.get('/users/all')
    if (response.status === 200) {
        return response.data
    }
    return []
    console.log(response);
  } catch (error) {
    return error;
  }
}

export const deleteUser = async (id: number) => {
  try {
    const response = await API.delete(`/users/${id}`);
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    return error;
  }
};

export const updateUser = async (id: number, updateUserDto: UpdateUserDto) => {
  try {
    const response = await API.patch(`/users/${id}`, updateUserDto);
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error) {
    return error;
  }
};