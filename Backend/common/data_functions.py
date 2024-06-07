def split_data(data,cutoff):
    keys = list(data.keys())
    values = list(data.values())

    key_set_1 = keys[:-cutoff]
    key_set_2 = keys[-cutoff:]
    key_set_2.insert(0, keys.pop(0))

    value_set_1 = values[:-cutoff]
    value_set_2 = values[-cutoff:]
    value_set_2.insert(0, values.pop(0))

    data_set_1 = {key_set_1[i]: value_set_1[i] for i in range(len(key_set_1))}
    data_set_2 = {key_set_2[i]: value_set_2[i] for i in range(len(key_set_2))}

    return data_set_1, data_set_2

def convert_keys_values_to_string(keys, values):
    keys = ", ".join(map(str, keys))
    values = ", ".join(map(str, values))
    return keys, values