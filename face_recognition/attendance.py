# This script detects faces for 30 seconds, marks unique attendance, and sends it to the admin dashboard via Socket.IO.
import cv2
import os
import time
import csv
import numpy as np
from datetime import datetime
import socketio

# Directory paths
DATA_PATH = 'data/'
MODEL_PATH = 'model.yml'
CSV_FILE = 'persons.csv'
UNKNOWN_PATH = os.path.join(DATA_PATH, 'unknown')
SOCKET_URL = 'http://localhost:5000'  # From .env in frontend

# Ensure unknown folder exists
os.makedirs(UNKNOWN_PATH, exist_ok=True)

# Load registered persons from CSV
with open(CSV_FILE, 'r') as f:
    reader = csv.reader(f)
    persons = {int(row[0]): row[1:] for row in reader if row}  # ID: [username, roll_number]

# Load the trained face recognition model
recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.read(MODEL_PATH)

# Load face detector (Haar cascade)
face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Initialize camera
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Could not open camera.")
    exit()

# Set video capture duration
start_time = time.time()
duration = 10  # Run for 30 seconds

# Track present persons and unknown count
present_ids = set()
unknown_count = 0

# Setup Socket.IO client
sio = socketio.Client()
try:
    sio.connect(SOCKET_URL)
except Exception as e:
    print(f"Could not connect to Socket.IO server: {e}")
    cap.release()
    cv2.destroyAllWindows()
    exit()

print("Scanning for 10 seconds...")

while time.time() - start_time < duration:
    ret, frame = cap.read()
    if not ret:
        print("Error: Could not read frame.")
        break

    # Convert frame to grayscale for face detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3)

    # Process each detected face
    for (x, y, w, h) in faces:
        face_img = gray[y:y+h, x:x+w]
        face_img = cv2.resize(face_img, (150, 150))
        label, confidence = recognizer.predict(face_img)
        # Confidence threshold (adjust as needed)
        if confidence < 70 and label in persons:
            if label not in present_ids:
                present_ids.add(label)
                username, roll_number = persons[label]
                now = datetime.now()
                attendance_data = {
                    'rollNumber': roll_number,
                    'name': username,
                    'date': now.strftime('%Y-%m-%dT%H:%M:%S')
                }
                # Send attendance to server via Socket.IO
                sio.emit('attendance', attendance_data)
                print(f"Attendance marked: {username} ({roll_number}) at {attendance_data['date']}")
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, persons[label][0], (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        else:
            # Unknown person
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
            cv2.putText(frame, "Unknown", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            # Save unknown face image
            unknown_img_path = os.path.join(UNKNOWN_PATH, f'unknown_{unknown_count}.jpg')
            cv2.imwrite(unknown_img_path, frame[y:y+h, x:x+w])
            unknown_count += 1
            # Optionally notify server of unknown face
            # sio.emit('unknownFace', {'timestamp': datetime.now().isoformat()})

    # Display the frame with detections
    cv2.imshow('Attendance System', frame)

    # Break loop if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
sio.disconnect()

# Output attendance results
print("\nAttendance Results:")
if present_ids:
    print("Present:")
    for id in present_ids:
        username, roll_number = persons[id]
        print(f"- {username} (Roll: {roll_number})")
else:
    print("No registered persons detected.")
