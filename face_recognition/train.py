import cv2
import os
import numpy as np
import csv

def train_model():
    # Directory paths
    data_path = 'data/'
    model_path = 'model.yml'
    csv_file = 'persons.csv'

    # Initialize face recognizer
    recognizer = cv2.face.LBPHFaceRecognizer_create()

    # Lists to store images and labels
    faces = []
    labels = []

    # Load registered persons from CSV to get the mapping
    id_mapping = {}
    with open(csv_file, 'r') as f:
        reader = csv.reader(f)
        for row in reader:
            if row:  # Skip empty rows
                user_id = int(row[0])
                id_mapping[str(user_id)] = user_id

    # Load images from data directory
    print("Loading face images for training...")
    for folder_name in os.listdir(data_path):
        folder_path = os.path.join(data_path, folder_name)
        if not os.path.isdir(folder_path) or folder_name == 'unknown':
            continue
        
        if folder_name in id_mapping:
            label = id_mapping[folder_name]  # Use the user_id from CSV as label
            print(f"Processing images for user ID: {label}")
            
            for img_name in os.listdir(folder_path):
                if img_name.endswith('.jpg'):
                    img_path = os.path.join(folder_path, img_name)
                    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                    if img is not None:
                        img = cv2.resize(img, (150, 150))  # Consistent size
                        faces.append(img)
                        labels.append(label)
                        print(f"Loaded: {img_path} with label {label}")
                    else:
                        print(f"Warning: Could not load {img_path}")

    if not faces:
        print("Error: No face images found. Please register faces first.")
        return

    # Train the recognizer
    print(f"Training face recognizer with {len(faces)} images...")
    recognizer.train(faces, np.array(labels))

    # Save the trained model
    recognizer.save(model_path)
    print(f"Model saved as {model_path}")
    print("Training complete. The system is ready for attendance.")

if __name__ == "__main__":
    train_model()