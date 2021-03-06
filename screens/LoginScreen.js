import React, { Component } from 'react';
import { View, Text, StyleSheet, Button,Dimensions ,TextInput} from 'react-native';
import firebase from 'firebase';
import * as Google from 'expo-google-app-auth';
import {Asset} from 'expo-asset';
import {AppLoading} from 'expo';
import Animated,{Easing} from 'react-native-reanimated';
import {TapGestureHandler,State} from 
'react-native-gesture-handler';
import Svg,{Image,Circle,ClipPath} from 'react-native-svg';



const {
  Value,
  event,
  block,
  cond,
  eq,
  set,
  Clock,
  startClock,
  stopClock,
  debug,
  timing,
  clockRunning,
  interpolate,
  Extrapolate,
  concat
} = Animated;

const {width,height}=Dimensions.get('window');

function cacheImages(images) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

// react native reanimated

function runTiming(clock, value, dest) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration: 1000,
    toValue: new Value(0),
    easing: Easing.inOut(Easing.ease)
  };

  return block([
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.frameTime, 0),
      set(config.toValue, dest),
      startClock(clock)
    ]),
    timing(clock, state, config),
    cond(state.finished, debug('stop clock', stopClock(clock))),
    state.position
  ]);
}

class LoginScreen extends Component {


  isUserEqual = (googleUser, firebaseUser) => {
    //console.log ("this is login from firebase1")
    if (firebaseUser) { 
      //console.log ("this is login from firebase2")
      var providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (
          providerData[i].providerId ===
            firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
          providerData[i].uid === googleUser.getBasicProfile().getId()
        ) {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  };
  onSignIn = googleUser => {
    console.log('Google Auth Response', googleUser);
    // We need to register an Observer on Firebase Auth to make sure auth is initialized.
    var unsubscribe = firebase.auth().onAuthStateChanged(
      function(firebaseUser) {
        unsubscribe();
        // Check if we are already signed-in Firebase with the correct user.
        if (!this.isUserEqual(googleUser, firebaseUser)) {
          // Build Firebase credential with the Google ID token.
          var credential = firebase.auth.GoogleAuthProvider.credential(
            googleUser.idToken,
            googleUser.accessToken
          );
          // Sign in with credential from the Google user.
          firebase
            .auth()
            .signInAndRetrieveDataWithCredential(credential)
            .then(function(result) {
              console.log('user signed in ');
              if (result.additionalUserInfo.isNewUser) {
                firebase
                  .database()
                  .ref('/users/' + result.user.uid)
                  .set({
                    gmail: result.user.email,
                    profile_picture: result.additionalUserInfo.profile.picture,
                    first_name: result.additionalUserInfo.profile.given_name,
                    last_name: result.additionalUserInfo.profile.family_name,
                    created_at: Date.now()
                  })
                  .then(function(snapshot) {
                    console.log('Snapshot', snapshot);
                  });
              } else {
                firebase
                  .database()
                  .ref('/users/' + result.user.uid)
                  .update({
                    last_logged_in: Date.now()
                  });
              }
            })
            .catch(function(error) {
              // Handle Errors here.
              var errorCode = error.code;
              var errorMessage = error.message;
              // The email of the user's account used.
              var email = error.email;
              // The firebase.auth.AuthCredential type that was used.
              var credential = error.credential;
              // ...
            });
        } else {
          console.log('User already signed-in Firebase.');
        }
      }.bind(this)
    );
  };
  signInWithGoogleAsync = async () => {
    try {
      
      const result = await Google.logInAsync({
        
        //behavior: 'web',
        androidClientId:'88390182378-3gotfh02v8kbfd93hu5ke728g4q5m13o.apps.googleusercontent.com',
        iosClientId: '', //enter ios client id
        scopes: ['profile', 'email']
      });
      //console.log ("this is try")

      if (result.type === 'success') {
        //console.log ("this is testing")
        this.onSignIn(result);
        return result.accessToken;
      } else {
         //console.log ("this is error")
        return { cancelled: true };
      }
    } catch (e) {
      return { error: true };
    }
  };

  // Assets and front-end working start here
      constructor(){
        super()
        this.state={
          isReady:false
        }

        this.buttonOpacity = new Value(1);


        this.onStateChange = event([
          {
            nativeEvent: ({state})=>block([
              cond(eq(state,State.END),set(this.buttonOpacity,runTiming(new Clock(), 1, 0)))
            ])
          }
        ]),
        this.onCloseState =  event([
          {
            nativeEvent: ({state})=>block([
              cond(eq(state,State.END),set(this.buttonOpacity,runTiming(new Clock(), 0, 1)))
            ])
          }
        ]),


       


        this.buttonY = interpolate(this.buttonOpacity, {
          inputRange: [0, 1],
          outputRange: [100, 0],
          extrapolate: Extrapolate.CLAMP
        });
    
        this.bgY = interpolate(this.buttonOpacity, {
          inputRange: [0, 1],
          outputRange: [-height / 3  -50, 0],
          extrapolate: Extrapolate.CLAMP
        });
        this.textInputZindex = interpolate(this.buttonOpacity, {
          inputRange: [0, 1],
          outputRange: [1,-1],
          extrapolate: Extrapolate.CLAMP
        });
        this.textInputOpacity = interpolate(this.buttonOpacity, {
          inputRange: [0, 1],
          outputRange: [1,0],
          extrapolate: Extrapolate.CLAMP
        });
        this.textInputY = interpolate(this.buttonOpacity, {
          inputRange: [0, 1],
          outputRange: [0,100],
          extrapolate: Extrapolate.CLAMP
        });
        this.rotateCross = interpolate(this.buttonOpacity, {
          inputRange: [0, 1],
          outputRange: [180,360],
          extrapolate: Extrapolate.CLAMP
        });


      }



      async _loadAssetsAsync() {
        const imageAssets = cacheImages([

          require('./assets/bg.jpg'),
        ]);
        await Promise.all([...imageAssets]);
  }

  render() {
    if (!this.state.isReady) {
      return (
        <AppLoading
          startAsync={this._loadAssetsAsync}
          onFinish={() => this.setState({ isReady: true })}
          onError={console.warn}
        />
      );
    }
    return (
      <View style={{flex: 1,backgroundColor:'white',
      justifyContent:'flex-end' }}>



        <Animated.View style={{...StyleSheet.absoluteFill,transform: [{ translateY: this.bgY }]}}>

          <Svg height={height+50} width={width}>
          <ClipPath id="clip">
          <Circle r={height+50} cx={width / 2} />

          </ClipPath>


          <Image 
          href={require('./assets/bg.jpg')}
         height={height+50}
         width={width}
         preserveAspectRatio='xMidYMid slice'
         clipPath="url(#clip)" 

          />
          </Svg>
        </Animated.View>
        <View style={{height:height/3,justifyContent:'center'}}>


        <TapGestureHandler onHandlerStateChange = {this.onStateChange}>

        <Animated.View style={{...styles.button,opacity:this.buttonOpacity, transform: [{ translateY: this.buttonY }],backgroundColor:'#00000050'}}>
          <Text style={{fontSize:20, fontWeight:'bold',color:'white'}}  > SIGN IN 
          </Text>
        </Animated.View> 

        </TapGestureHandler>


        <Animated.View style={{...styles.button,opacity:this.buttonOpacity, transform: [{ translateY: this.buttonY }],backgroundColor:'white'}}>
          <Text style={{fontSize:20, fontWeight:'bold',color:'black'}} onPress={() => this.signInWithGoogleAsync()} >
             SIGN IN WITH Google
          </Text> 
        </Animated.View>

        <Animated.View 
        
        style={{
          zIndex : this.textInputZindex,
          opacity: this.textInputOpacity,
          transform:[{translateY:this.textInputY}],
          height:height/3 ,
         ...StyleSheet.absoluteFill,
         top:null,
         justifyContent:'center'}}>

           <TapGestureHandler onHandlerStateChange={this.onCloseState}>
            <Animated.View style={styles.closebutton}>
            <Animated.Text style={{fontSize:15,
               transform:[{rotate: concat(this.rotateCross,'deg')}]}}
               >X
               </Animated.Text>

            </Animated.View>


           </TapGestureHandler>

        <TextInput
        placeholder="EMAIL"
        style={styles.textInput}
        placeholderTextColor="black"

        />
        <TextInput
        placeholder="PASSWORD"
        style={styles.textInput}
        placeholderTextColor="black"
                
        />
        <Animated.View style={styles.button}>

          <Text style={{fontSize:20,fontWeight:'bold'}}>SIGN IN</Text>

        </Animated.View>

        

        </Animated.View>

        </View>
     
      </View>
    );
  }
  }
export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  button:{
    backgroundColor:'white',
    height:45,
    marginHorizontal:50,
    borderRadius: 50,
    alignItems:"center",
    justifyContent:'center',
    marginVertical: 5,
    shadowOffset:{width:2,height:2},
    shadowColor:'black',
    shadowOpacity:0.2
  },

  closebutton:{
    height:40,
    width:40,
    backgroundColor:'white',
    borderRadius:20,
    alignItems:'center',
    justifyContent:'center',
    position:'absolute',
    top:-20,
    left: width/2 -20,
    shadowOffset:{width:2,height:2},
    shadowColor:'black',
    shadowOpacity:0.2

  },
  textInput:{
    height:50,
    borderRadius:25,
    borderWidth:0.5,
    marginHorizontal:20,
    paddingLeft:10,
    marginVertical:5,
    borderColor:'rgba(0,0,0,0.2)',

  }
});