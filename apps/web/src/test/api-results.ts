export function ok<T>(body: T) {
  return { data: body, error: undefined, response: new Response(null, { status: 200 }) };
}

export function failure(status: number) {
  return {
    data: undefined,
    error: { status, title: 'error' },
    response: new Response(null, { status }),
  };
}
