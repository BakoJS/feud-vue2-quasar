import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
})


export default ({ Vue }) => {
  Vue.prototype.$axios = axios
}

// Here we define a named export
// that we can later use inside .js files:
export { axiosInstance }
