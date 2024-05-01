def update_figurine(position, new_figurine):
    # Retrieve current data from the database
    current_data = retrieve_data_from_database()

    # Check if the provided position already exists
    if position in current_data:
        # Push down all rows starting from the specified position
        for i in range(len(current_data), position, -1):
            current_data[i] = current_data[i - 1]
    else:
        # Move an existing row to the new position
        for i, figurine in current_data.items():
            if figurine == new_figurine:
                # If the figurine matches the new one, move it to the new position
                del current_data[i]
                break

    # Insert the new figurine at the specified position
    current_data[position] = new_figurine

    # Save the updated data back to the database
    save_data_to_database(current_data)
