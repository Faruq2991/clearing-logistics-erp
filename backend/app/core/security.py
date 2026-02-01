from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.core.auth_utils import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def check_admin_privilege(current_user: User = Depends(get_current_user)):

    if current_user.role != UserRole.ADMIN:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="You do not have permission to perform this action"

        )

    return current_user



def check_staff_privilege(current_user: User = Depends(get_current_user)):

    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="You do not have permission to perform this action"

        )

    return current_user
