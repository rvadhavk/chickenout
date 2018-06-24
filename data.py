from keras.applications.mobilenet import preprocess_input
from keras.preprocessing.image import ImageDataGenerator

# returns (training_data, validation_data)
def LoadData():
  data_generator = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.3,
    #rotation_range=40,
    width_shift_range=0.2,
    height_shift_range=0.2,
    #shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    #fill_mode='nearest'
  )
  return (data_generator.flow_from_directory(
    'data',
    subset=subset,
    classes=['not_chickens','chickens'],
    target_size=(128,128),
    batch_size=16,
    class_mode='binary') for subset in ('training', 'validation')
  )

