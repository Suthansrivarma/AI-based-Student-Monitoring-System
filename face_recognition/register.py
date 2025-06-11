import cv2
import os
import csv
from pathlib import Path

def register_person():
    # Directory for storing face images
    data_path = 'data/'
    csv_file = 'persons.csv'

    # Ensure data directory exists
    os.makedirs(data_path, exist_ok=True)

    # Read existing persons to determine next ID
    if os.path.exists(csv_file):
        with open(csv_file, 'r') as f:
            reader = csv.reader(f)
            existing_ids = [int(row[0]) for row in reader if row]
            user_id = max(existing_ids) + 1 if existing_ids else 1
    else:
        user_id = 1

    # Get user details
    username = input("Enter username: ")
    roll_number = input("Enter roll number: ")

    # Create a directory using roll number
    user_dir = os.path.join(data_path, str(user_id))  # Using user_id as folder name
    os.makedirs(user_dir, exist_ok=True)

    # Save user details to CSV
    with open(csv_file, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([user_id, username, roll_number])

    # Initialize camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    # Load face detector
    face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Capture 20 face images
    print(f"Capturing 20 face images for {username}...")
    count = 0
    while count < 20:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            break

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_detector.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        if len(faces) > 0:
            # Process detected face
            x, y, w, h = faces[0]  # Use the first detected face
            # Extract and resize face
            face_img = gray[y:y+h, x:x+w]
            face_img = cv2.resize(face_img, (150, 150))  # Use 150x150 size
            # Save image
            img_path = os.path.join(user_dir, f'{count}.jpg')
            cv2.imwrite(img_path, face_img)
            count += 1
            # Draw rectangle on display
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f'Image {count}/20', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        # Show frame
        cv2.imshow('Capturing Face', frame)

        # Wait briefly and check for exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release resources
    cap.release()
    cv2.destroyAllWindows()

    print(f"Successfully captured 20 images for {username} (ID: {user_id}).")
    print("Please run train.py to update the face recognition model.")

if __name__ == "__main__":
    register_person()