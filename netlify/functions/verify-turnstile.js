exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({error: 'Method not allowed'}),
    }
  }

  try {
    const {token} = JSON.parse(event.body)

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({error: 'Token required'}),
      }
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const data = await result.json()

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: data.success,
        'error-codes': data['error-codes'] || [],
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({error: 'Verification failed'}),
    }
  }
}
