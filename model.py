from keras.applications.mobilenet import MobileNet
import tensorflowjs as tfjs

alpha = 0.25

base_model = MobileNet(alpha=alpha)
base_model = MobileNet(input_shape=(64,64,3), include_top=False)

tfjs.converters.save_keras_model(model, 'extension/model')

