import axios from 'axios'

// 默认 HTTP 错误处理
function handleErrors(response) {
  if (!!response.data.code && response.data.code !== 0) {
    throw new Error(`Invalid status: ${response}`)
  } else if (!!response.code && response.code !== 0) {
    throw new Error(`Invalid status: ${response}`)
  }
}

export const RESTful = (url, config) => {
  let rest = axios.create({
    baseURL: url,
    ...config
  })
  const handleHttpErrors = config.handleHttpErrors || handleErrors

  // http request 拦截器
  rest.interceptors.request.use(
    config => {
      const needAuth = typeof config.needAuth === 'boolean' ? config.needAuth : true
      if (needAuth) {
        const token = JSON.parse(window.localStorage['jwtToken'])
        // 判断是否存在token，如果存在的话，则每个http header都加上token
        if (token) {
          config.headers.Authorization = 'Bearer ' + token
        }
      }
      return config
    },
    err => {
      return Promise.reject(err)
    }
  )

  // http response 拦截器
  rest.interceptors.response.use(response => {
    handleHttpErrors(response)
    return response
  }, err => {
    return Promise.reject(err)
  })

  // console.log(axios)

  return rest
}