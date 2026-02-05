from flask import request

def get_identity():
    """
    Identifies the actual user.
    1. If it comes from the Proxy, use X-Forwarded-For.
    2. If it's direct access, use remote_addr.
    """
    if request.headers.getlist("X-Forwarded-For"):
        return request.headers.getlist("X-Forwarded-For")[0]
    return request.remote_addr