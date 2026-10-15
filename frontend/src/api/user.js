import request from '@/utils/request'

/** 获取当前用户信息 */
export function getUserInfo() {
  return request({
    url: '/api/user/me',
    method: 'get'
  })
}

/** 修改个人信息 */
export function updateUserInfo(data) {
  return request({
    url: '/api/user/me',
    method: 'put',
    data
  })
}

export function updatePassword(data) {
  return request({
    url: '/api/user/password',
    method: 'put',
    data
  })
}
