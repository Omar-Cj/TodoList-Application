from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager,create_access_token, jwt_required,get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import SQLALCHEMY_DATABASE_URI,SECRET_KEY,JWT_SECRET_KEY
from datetime import timedelta


app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500"])


app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Set the secret keys
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY # Change this!
app.config['SECRET_KEY'] = SECRET_KEY 

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Import models
from models import Task,User


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400
    
    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully!"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        expires = timedelta(minutes=30)
        access_token = create_access_token(identity=user.id,expires_delta=expires)
        return jsonify({"access_token": access_token}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401



@app.route('/')
def index():
    return jsonify({'message': 'TODOLIST APPLICATION'})


@app.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    data = request.get_json()
    task_name = data.get('task_name')
    priority = data.get('priority')
    status = data.get('status')
    description = data.get('description')

    user_id = get_jwt_identity()
    new_task = Task(task_name=task_name, priority=priority, status=status, description=description, user_id=user_id)

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.to_dict()), 201


@app.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([task.to_dict() for task in tasks]), 200


@app.route('/tasks/<int:id>', methods=['GET'])
@jwt_required()
def get_task(id):
    user_id = get_jwt_identity()
    task = Task.query.get(id)
    
    if task is None:
        return jsonify({'message': 'Task not found'}), 404
    
    if task.user_id != user_id:
        return jsonify({'message': 'Unauthorized to get this task'}), 403

    return jsonify(task.to_dict()), 200


@app.route('/tasks/<int:id>', methods=['PUT'])
@jwt_required()
def update_task(id):
    user_id = get_jwt_identity()  # Get the authenticated user's ID
    task = Task.query.get(id)

    if task is None:
        return jsonify({'message': 'Task not found'}), 404

    # Check if the task belongs to the authenticated user
    if task.user_id != user_id:
        return jsonify({'message': 'Unauthorized to update this task'}), 403

    # Fetch data from the request body
    data = request.json

    task.task_name = data.get('task_name', task.task_name)
    task.priority = data.get('priority', task.priority)
    task.status = data.get('status', task.status)
    task.description = data.get('description', task.description)

    db.session.commit()

    return jsonify({'message': 'Task updated successfully!'}), 200


@app.route('/tasks/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_task(id):
    user_id = get_jwt_identity()  # Get the authenticated user's ID
    task = Task.query.get(id)

    if task is None:
        return jsonify({'message': 'Task not found'}), 404

    # Check if the task belongs to the authenticated user
    if task.user_id != user_id:
        return jsonify({'message': 'Unauthorized to delete this task'}), 403

    db.session.delete(task)
    db.session.commit()

    return jsonify({'message': 'Task deleted successfully!'}), 200




if __name__ == '__main__':
    app.run(debug=True)
